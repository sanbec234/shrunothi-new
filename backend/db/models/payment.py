from datetime import datetime, timezone
from db.client import get_db


def create_payment_record(email, order_id, amount, payment_type):
    """Create an immutable payment record in db.payments."""
    db = get_db()
    payment_doc = {
        "razorpay_order_id": order_id,
        "user_email": email.lower().strip(),
        "amount": amount,
        "currency": "INR",
        "payment_type": payment_type,
        "status": "created",
        "payment_method": None,
        "razorpay_signature": None,
        "created_at": datetime.now(timezone.utc),
        "paid_at": None,
        "expires_at": None,
        "metadata": {},
    }
    result = db.payments.insert_one(payment_doc)
    payment_doc["_id"] = result.inserted_id

    # Append the initial event to the immutable audit log.
    _append_payment_event(
        db=db,
        order_id=order_id,
        event="payment.created",
        status="created",
        email=email,
        metadata={"amount": amount, "payment_type": payment_type},
    )

    return payment_doc


def update_payment_status(razorpay_payment_id, status, razorpay_order_id=None,
                          signature=None, metadata=None):
    """
    Update payment status after webhook confirmation.

    Uses an atomic compare-and-swap filter so duplicate webhooks for the same
    transition are safely ignored (prevents double subscription activation).
    """
    db = get_db()
    update_data = {
        "status": status,
        "razorpay_payment_id": razorpay_payment_id,
    }

    if signature:
        update_data["razorpay_signature"] = signature

    if status in ("authorized", "captured"):
        update_data["paid_at"] = datetime.now(timezone.utc)

    if metadata:
        update_data["metadata"] = metadata

    # Atomic CAS: only transition if the current status is a valid predecessor.
    # This prevents duplicate webhooks from racing and double-activating.
    VALID_PREDECESSORS = {
        "authorized": ["created"],
        "captured":   ["created", "authorized"],
        "failed":     ["created", "authorized"],
        "refunded":   ["captured"],
    }
    predecessor_filter = VALID_PREDECESSORS.get(status)

    if predecessor_filter:
        result = db.payments.update_one(
            {
                "razorpay_order_id": razorpay_order_id,
                "status": {"$in": predecessor_filter},
            },
            {"$set": update_data},
        )
    else:
        result = db.payments.update_one(
            {"razorpay_order_id": razorpay_order_id},
            {"$set": update_data},
        )

    # Always append to the immutable audit log regardless of update result.
    _append_payment_event(
        db=db,
        order_id=razorpay_order_id,
        event=f"payment.{status}",
        status=status,
        razorpay_payment_id=razorpay_payment_id,
        metadata=metadata or {},
    )

    return result.modified_count > 0


def get_user_payments(email, limit=20, offset=0):
    """Fetch a paginated slice of a user's payment records (newest first)."""
    db = get_db()
    cursor = (
        db.payments.find({"user_email": email.lower().strip()})
        .sort("created_at", -1)
        .skip(offset)
        .limit(limit)
    )
    return list(cursor)


def get_payment_by_order_id(order_id):
    """Get full payment record by Razorpay order ID (internal use)."""
    db = get_db()
    return db.payments.find_one({"razorpay_order_id": order_id})


def get_payment_events(order_id):
    """Return the full immutable event log for an order (newest first)."""
    db = get_db()
    return list(
        db.payment_events.find({"razorpay_order_id": order_id})
        .sort("timestamp", -1)
    )


def serialize_payment_public(doc):
    """Sanitized serializer for user-facing responses (no signatures, metadata)."""
    if not doc:
        return None
    return {
        "id": str(doc.get("_id", "")),
        "amount": doc.get("amount"),
        "currency": doc.get("currency"),
        "payment_type": doc.get("payment_type"),
        "status": doc.get("status"),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        "paid_at": doc.get("paid_at").isoformat() if doc.get("paid_at") else None,
    }


def serialize_payment_internal(doc):
    """Full serializer for backend/admin use (includes signature + metadata)."""
    if not doc:
        return None
    return {
        "id": str(doc.get("_id", "")),
        "razorpay_order_id": doc.get("razorpay_order_id"),
        "razorpay_payment_id": doc.get("razorpay_payment_id"),
        "user_email": doc.get("user_email"),
        "amount": doc.get("amount"),
        "currency": doc.get("currency"),
        "payment_type": doc.get("payment_type"),
        "status": doc.get("status"),
        "payment_method": doc.get("payment_method"),
        "razorpay_signature": doc.get("razorpay_signature"),
        "metadata": doc.get("metadata"),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        "paid_at": doc.get("paid_at").isoformat() if doc.get("paid_at") else None,
    }


# ── Internal audit log ────────────────────────────────────────────────────────

def _append_payment_event(db, order_id, event, status, email=None,
                           razorpay_payment_id=None, metadata=None):
    """
    Append an immutable event to db.payment_events.
    This collection is never updated — only inserted into.
    Every state transition for every payment is preserved here permanently.
    """
    db.payment_events.insert_one({
        "razorpay_order_id": order_id,
        "razorpay_payment_id": razorpay_payment_id,
        "event": event,
        "status": status,
        "user_email": email,
        "metadata": metadata or {},
        "timestamp": datetime.now(timezone.utc),
    })
