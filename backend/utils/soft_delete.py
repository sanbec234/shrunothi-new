"""
Soft-delete helpers — provides a recoverable delete pattern for all content.

Instead of `db.collection.delete_one(...)`, use `soft_delete(db.collection, oid, actor)`.
The document is marked with `deleted_at` and `deleted_by` instead of being removed,
and remains in the database for recovery.

Reads should filter out soft-deleted docs with `not_deleted_filter()`:
    db.materials.find({**not_deleted_filter(), "genreId": ...})

Recovery:
    restore(db.collection, oid)

Permanent purge (after grace period):
    purge_soft_deleted(db.collection, older_than_days=30)
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from bson import ObjectId


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def not_deleted_filter() -> dict:
    """Filter to exclude soft-deleted docs from queries.

    Use:  db.materials.find({**not_deleted_filter(), "other": "filter"})
    """
    return {"deleted_at": {"$exists": False}}


def soft_delete(collection, oid, actor_email: Optional[str] = None) -> bool:
    """Mark a document as deleted without removing it.

    Returns True if a document was marked deleted, False otherwise.
    Idempotent — calling twice is a no-op for the second call.
    """
    if isinstance(oid, str):
        oid = ObjectId(oid)
    result = collection.update_one(
        {"_id": oid, "deleted_at": {"$exists": False}},
        {
            "$set": {
                "deleted_at": now_utc(),
                "deleted_by": actor_email or "system",
            }
        },
    )
    return result.modified_count > 0


def restore(collection, oid) -> bool:
    """Undo a soft-delete. Returns True if restored, False if doc wasn't deleted."""
    if isinstance(oid, str):
        oid = ObjectId(oid)
    result = collection.update_one(
        {"_id": oid, "deleted_at": {"$exists": True}},
        {"$unset": {"deleted_at": "", "deleted_by": ""}},
    )
    return result.modified_count > 0


def list_deleted(collection, limit: int = 100) -> list:
    """List soft-deleted documents (for admin recovery UI)."""
    cursor = (
        collection.find({"deleted_at": {"$exists": True}})
        .sort("deleted_at", -1)
        .limit(limit)
    )
    return list(cursor)


def purge_soft_deleted(collection, older_than_days: int = 30) -> int:
    """Hard-delete docs that have been soft-deleted for more than `older_than_days`.

    Returns count of permanently deleted docs.
    Run via scheduled job, NOT from request handlers.
    """
    cutoff = now_utc() - timedelta(days=older_than_days)
    result = collection.delete_many({"deleted_at": {"$lt": cutoff}})
    return result.deleted_count
