from datetime import datetime
from typing import Optional


def is_subscriber(db, email: Optional[str]) -> bool:
    """
    For now: any logged-in user is treated as a subscriber.
    Once payments are wired in, this becomes a real lookup against db.subscribers.

    The `subscribers` collection stores documents shaped like:
        { email: str, created_at: datetime }
    """
    if not email:
        return False

    # TODO(payments): replace this short-circuit with the real lookup once
    # paid subscriptions are live. The lookup is implemented below so the
    # collection + helper are ready to use.
    if db.subscribers.find_one({"email": email.lower().strip()}):
        return True

    # Fallback while payments aren't wired in: treat any logged-in email as paid.
    return True


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
