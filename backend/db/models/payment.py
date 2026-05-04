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
    return payment_doc


def update_payment_status(razorpay_payment_id, status, razorpay_order_id=None,
                          signature=None, metadata=None):
    """Update payment status after webhook confirmation."""
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

    result = db.payments.update_one(
        {"razorpay_order_id": razorpay_order_id},
        {"$set": update_data},
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
