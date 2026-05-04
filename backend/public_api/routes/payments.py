import hmac
import hashlib
import logging
import secrets
from datetime import datetime, timezone, timedelta

from flask import Blueprint, request, jsonify

from auth.auth_guard import require_user
from config.razorpay_config import (
    get_razorpay_client,
    RAZORPAY_KEY_ID,
    RAZORPAY_WEBHOOK_SECRET,
)
from extensions import limiter
from db.models.payment import (
    create_payment_record,
    update_payment_status,
    get_user_payments,
    get_payment_by_order_id,
    serialize_payment_public,
)
from db.models.subscriber import (
    is_subscriber,
    get_subscriber_details,
    create_subscription,
)
from db.client import get_db

bp = Blueprint("payments", __name__)
log = logging.getLogger(__name__)

# Server-side whitelist of valid plans. Frontend cannot dictate amounts.
PLAN_AMOUNTS = {
    "monthly": 9900,    # ₹99
    "annual":  99900,   # ₹999
}

PLAN_TO_TYPE = {
    "monthly": "recurring",
    "annual":  "one_time",
}


def _email_hash(email: str) -> str:
    """Short non-reversible hash for log lines (avoids logging raw PII)."""
    return hashlib.sha256(email.encode()).hexdigest()[:8]


@bp.route("/create-order", methods=["POST"])
@limiter.limit("5 per minute; 20 per hour")
@require_user
def create_order():
    """
    Create a Razorpay order. Frontend sends a plan key; backend looks up
    the canonical amount from PLAN_AMOUNTS — never trust client-supplied amount.

    Body: { "plan": "monthly" | "annual" }
    """
    user_email = request.user["email"]
    data = request.get_json(silent=True) or {}
    plan = data.get("plan")

    if plan not in PLAN_AMOUNTS:
        return jsonify({"error": "Invalid plan"}), 400

    amount = PLAN_AMOUNTS[plan]
    payment_type = PLAN_TO_TYPE[plan]

    receipt = f"rcpt_{secrets.token_hex(8)}_{int(datetime.now(timezone.utc).timestamp())}"

    try:
        razorpay_order = get_razorpay_client().order.create({
            "amount": amount,
            "currency": "INR",
            "receipt": receipt,
            "notes": {
                "user_hash": _email_hash(user_email),
                "plan": plan,
                "payment_type": payment_type,
            },
        })
    except Exception as e:
        log.exception("Razorpay order creation failed: %s", e)
        return jsonify({"error": "Payment provider unavailable"}), 502

    create_payment_record(
        email=user_email,
        order_id=razorpay_order["id"],
        amount=amount,
        payment_type=payment_type,
    )

    log.info(
        "Order created: user=%s order=%s plan=%s",
        _email_hash(user_email), razorpay_order["id"], plan,
    )

    return jsonify({
        "order_id": razorpay_order["id"],
        "amount": amount,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "email": user_email,
        "payment_type": payment_type,
        "plan": plan,
    }), 201


@bp.route("/webhook", methods=["POST"])
@limiter.limit("100 per minute")
def handle_webhook():
    """
    Razorpay webhook receiver. Server-to-server, no user auth.
    HMAC signature is the primary defense; Content-Type check is defense-in-depth.

    Always returns 200 to Razorpay (except on signature failure / bad content-type)
    so retry storms are avoided.
    """
    if request.content_type != "application/json":
        return jsonify({"error": "Invalid content-type"}), 400

    raw_body = request.get_data()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not _verify_webhook_signature(raw_body, signature):
        log.warning("Webhook: invalid signature")
        return jsonify({"error": "Invalid signature"}), 401

    data = request.get_json(silent=True) or {}
    event = data.get("event", "")
    payment_entity = data.get("payload", {}).get("payment", {}).get("entity", {})

    razorpay_payment_id = payment_entity.get("id")
    razorpay_order_id = payment_entity.get("order_id")

    log.info("Webhook received: event=%s order=%s", event, razorpay_order_id)

    payment_record = get_payment_by_order_id(razorpay_order_id) if razorpay_order_id else None

    if not payment_record:
        log.warning("Webhook for unknown order: %s", razorpay_order_id)
        return jsonify({"status": "ignored_unknown_order"}), 200

    # Idempotency: if already terminal, skip re-processing.
    if payment_record.get("status") == "captured":
        log.info("Webhook ignored (already captured): order=%s", razorpay_order_id)
        return jsonify({"status": "already_processed"}), 200

    if event == "payment.captured":
        # ONLY activate subscription on actual capture. Authorized != captured.
        update_payment_status(
            razorpay_payment_id=razorpay_payment_id,
            status="captured",
            razorpay_order_id=razorpay_order_id,
            signature=signature,
            metadata=payment_entity,
        )

        user_email = payment_record["user_email"]
        payment_type = payment_record["payment_type"]
        expires_at = (
            datetime.now(timezone.utc) + timedelta(days=30)
            if payment_type == "recurring"
            else None
        )

        db = get_db()
        create_subscription(
            db=db,
            email=user_email,
            payment_id=razorpay_order_id,
            payment_type=payment_type,
            expires_at=expires_at,
        )

        log.info(
            "Subscription activated: user=%s type=%s order=%s",
            _email_hash(user_email), payment_type, razorpay_order_id,
        )

    elif event == "payment.authorized":
        # Just record state — money is held but not captured. No subscription yet.
        update_payment_status(
            razorpay_payment_id=razorpay_payment_id,
            status="authorized",
            razorpay_order_id=razorpay_order_id,
            signature=signature,
            metadata=payment_entity,
        )
        log.info("Payment authorized (awaiting capture): order=%s", razorpay_order_id)

    elif event == "payment.failed":
        update_payment_status(
            razorpay_payment_id=razorpay_payment_id,
            status="failed",
            razorpay_order_id=razorpay_order_id,
            signature=signature,
        )
        log.info("Payment failed: order=%s", razorpay_order_id)

    return jsonify({"status": "ok"}), 200


@bp.route("/verify-payment", methods=["POST"])
@limiter.limit("20 per minute")
@require_user
def verify_payment():
    """
    Backup verification path: frontend confirms payment immediately after the
    Razorpay handler fires. We verify the signature via Razorpay SDK and, if
    the matching order belongs to the caller and is paid, activate subscription.

    Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }

    Webhook remains the source of truth, but this lets the frontend bypass
    webhook-delay UX issues.
    """
    user_email = request.user["email"]
    data = request.get_json(silent=True) or {}
    order_id = data.get("razorpay_order_id")
    payment_id = data.get("razorpay_payment_id")
    sig = data.get("razorpay_signature")

    if not (order_id and payment_id and sig):
        return jsonify({"error": "Missing verification fields"}), 400

    try:
        get_razorpay_client().utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
        })
    except Exception:
        log.warning("verify-payment: bad signature for order=%s", order_id)
        return jsonify({"error": "Invalid signature"}), 401

    payment_record = get_payment_by_order_id(order_id)
    if not payment_record or payment_record.get("user_email") != user_email.lower().strip():
        return jsonify({"error": "Order does not belong to caller"}), 403

    if payment_record.get("status") == "captured":
        return jsonify({"status": "already_active"}), 200

    # Confirm with Razorpay that the payment really is captured.
    try:
        rp_payment = get_razorpay_client().payment.fetch(payment_id)
    except Exception as e:
        log.exception("verify-payment: failed to fetch payment %s: %s", payment_id, e)
        return jsonify({"error": "Verification unavailable"}), 502

    if rp_payment.get("status") != "captured":
        return jsonify({
            "status": "not_captured_yet",
            "razorpay_status": rp_payment.get("status"),
        }), 202

    update_payment_status(
        razorpay_payment_id=payment_id,
        status="captured",
        razorpay_order_id=order_id,
        signature=sig,
        metadata=rp_payment,
    )

    payment_type = payment_record["payment_type"]
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=30)
        if payment_type == "recurring"
        else None
    )

    db = get_db()
    create_subscription(
        db=db,
        email=user_email,
        payment_id=order_id,
        payment_type=payment_type,
        expires_at=expires_at,
    )

    log.info(
        "Subscription activated via verify-payment: user=%s order=%s",
        _email_hash(user_email), order_id,
    )

    return jsonify({"status": "active"}), 200


@bp.route("/subscription-status", methods=["GET"])
@limiter.limit("60 per minute")
@require_user
def get_subscription_status():
    """Return the caller's current subscription status. Hides expired details."""
    user_email = request.user["email"]
    db = get_db()

    active = is_subscriber(db, user_email)
    details = get_subscriber_details(db, user_email) if active else None

    return jsonify({
        "is_subscriber": active,
        "subscription_status": "active" if active else "not_subscribed",
        "subscription_type": details.get("payment_type") if details else None,
        "expires_at": details.get("expires_at") if details else None,
    }), 200


@bp.route("/payment-history", methods=["GET"])
@limiter.limit("30 per minute")
@require_user
def get_payment_history():
    """Paginated, sanitized payment audit trail for the caller."""
    user_email = request.user["email"]

    try:
        limit = min(max(int(request.args.get("limit", 20)), 1), 100)
        offset = max(int(request.args.get("offset", 0)), 0)
    except ValueError:
        return jsonify({"error": "Invalid pagination"}), 400

    payments = get_user_payments(user_email, limit=limit, offset=offset)
    return jsonify({
        "payments": [serialize_payment_public(p) for p in payments],
        "count": len(payments),
        "limit": limit,
        "offset": offset,
    }), 200


# ── internal helpers ─────────────────────────────────────────────────────────

def _verify_webhook_signature(body: bytes, signature: str) -> bool:
    """HMAC-SHA256 verification of Razorpay webhook payload."""
    if not RAZORPAY_WEBHOOK_SECRET or not signature:
        return False
    expected = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
