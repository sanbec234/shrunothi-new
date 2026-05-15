from datetime import datetime, timezone
from typing import Optional


def is_subscriber(db, email: Optional[str]) -> bool:
    """
    Check if a user has an active paid subscription. Returns False for missing
    email, no active record, or expired time-based subscriptions.
    """
    if not email:
        return False

    email = email.lower().strip()
    subscriber = db.subscribers.find_one({
        "user_email": email,
        "subscription_status": "active",
    })

    if not subscriber:
        return False

    expires_at = subscriber.get("expires_at")
    if expires_at:
        # Tolerate naive datetimes from older records.
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return False

    return True


def get_subscriber_details(db, email: Optional[str]) -> Optional[dict]:
    """Get full subscription details for a user."""
    if not email:
        return None

    email = email.lower().strip()
    subscriber = db.subscribers.find_one({"user_email": email})
    return _serialize_subscriber(subscriber) if subscriber else None


def create_subscription(db, email: str, payment_id: str, payment_type: str,
                        expires_at: Optional[datetime] = None) -> Optional[dict]:
    """
    Create or update a subscription after successful payment capture.

    Protection rules (never downgrade an existing active subscriber):
    - If the current record has expires_at=None (annual/lifetime), keep it as None
      regardless of the new payment_type.
    - If the current record has a future expires_at and the new expires_at is
      earlier, keep the longer window.
    - `started_at` is preserved on subsequent updates (uses $setOnInsert).
    """
    email = email.lower().strip()
    if not email:
        return None

    now = datetime.now(timezone.utc)

    # Read the current record so we can decide whether the new expiry is an upgrade.
    existing = db.subscribers.find_one({"user_email": email})

    effective_expires_at = expires_at

    if existing and existing.get("subscription_status") == "active":
        current_expires = existing.get("expires_at")

        if current_expires is None:
            # Current is lifetime/annual — never add an expiry.
            effective_expires_at = None
        elif expires_at is None:
            # New payment is annual/lifetime — upgrade from monthly to no-expiry.
            effective_expires_at = None
        else:
            # Both have expiry dates — keep whichever is later.
            cur = current_expires
            if cur.tzinfo is None:
                cur = cur.replace(tzinfo=timezone.utc)
            new = expires_at
            if new.tzinfo is None:
                new = new.replace(tzinfo=timezone.utc)
            effective_expires_at = max(cur, new)

    db.subscribers.update_one(
        {"user_email": email},
        {
            "$setOnInsert": {
                "user_email": email,
                "started_at": now,
                "created_at": now,
            },
            "$set": {
                "subscription_status": "active",
                "current_payment_id": payment_id,
                "subscription_tier": "standard",
                "expires_at": effective_expires_at,
                "payment_type": payment_type,
                "updated_at": now,
            },
        },
        upsert=True,
    )

    return db.subscribers.find_one({"user_email": email})


def _serialize_subscriber(doc) -> Optional[dict]:
    """Serialize subscriber doc for API responses."""
    if not doc:
        return None
    return {
        "user_email": doc.get("user_email"),
        "subscription_status": doc.get("subscription_status"),
        "subscription_tier": doc.get("subscription_tier"),
        "started_at": doc.get("started_at").isoformat() if doc.get("started_at") else None,
        "expires_at": doc.get("expires_at").isoformat() if doc.get("expires_at") else None,
        "payment_type": doc.get("payment_type"),
    }
