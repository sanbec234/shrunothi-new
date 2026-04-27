from datetime import datetime


def parse_datetime(value):
    """
    Convert ISO string → datetime.
    Returns None if value is empty or invalid.
    """
    if not value:
        return None

    try:
        return datetime.fromisoformat(value)
    except Exception:
        return None


def create_announcement(db, data):
    now = datetime.utcnow()

    # Parse optional scheduling fields
    start_at = parse_datetime(data.get("startAt"))
    end_at = parse_datetime(data.get("endAt"))

    # 🚫 Guard: end date cannot be before start date
    if start_at and end_at and end_at < start_at:
        raise ValueError("endAt cannot be before startAt")

    doc = {
        "title": data["title"],
        "imageUrl": data["imageUrl"],
        "isActive": data.get("isActive", True),

        # 🕒 Optional scheduling (stored as datetime or None)
        "startAt": start_at,
        "endAt": end_at,

        "createdAt": now,
        "updatedAt": now,
    }

    result = db.announcements.insert_one(doc)
    return result.inserted_id