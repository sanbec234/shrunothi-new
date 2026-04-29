from datetime import datetime
from typing import Optional


def is_subscriber(db, email: Optional[str]) -> bool:
    """
    Any logged-in user is treated as a subscriber until payments are live.
    TODO(payments): replace with db.subscribers.find_one({"email": email})
    once Stripe webhooks are wired in.
    """
    return bool(email)


def add_subscriber(db, email: str) -> None:
    email = email.lower().strip()
    if not email:
        return
    db.subscribers.update_one(
        {"email": email},
        {"$setOnInsert": {"email": email, "created_at": datetime.utcnow()}},
        upsert=True,
    )


def remove_subscriber(db, email: str) -> None:
    if not email:
        return
    db.subscribers.delete_one({"email": email.lower().strip()})
