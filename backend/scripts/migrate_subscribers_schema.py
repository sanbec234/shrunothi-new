"""
One-time migration: convert legacy db.subscribers documents to the new schema
introduced by the Razorpay payment integration.

Old shape: { email, created_at }
New shape: { user_email, subscription_status, subscription_tier, started_at,
             expires_at, payment_type, current_payment_id, created_at, updated_at }

Run with:
    cd backend && python -m scripts.migrate_subscribers_schema

The script is idempotent — running it twice is safe.

GRANDFATHERING POLICY: legacy users are upgraded to active "legacy_grandfathered"
subscriptions with no expiry (lifetime access). If you DON'T want this, comment
out the update_many call below and run the drop block instead.
"""
import sys
from pathlib import Path

# Make the backend package importable when running as a script.
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv(dotenv_path=BACKEND_DIR / ".env", override=True)

from db.client import get_db


def migrate():
    db = get_db()
    coll = db.subscribers

    legacy_count = coll.count_documents({
        "email": {"$exists": True},
        "user_email": {"$exists": False},
    })
    print(f"Found {legacy_count} legacy subscriber document(s) to migrate.")

    if legacy_count > 0:
        # Grandfather legacy users into the new schema.
        coll.update_many(
            {"email": {"$exists": True}, "user_email": {"$exists": False}},
            [
                {
                    "$set": {
                        "user_email": "$email",
                        "subscription_status": "active",
                        "subscription_tier": "legacy",
                        "started_at": "$created_at",
                        "expires_at": None,
                        "payment_type": "legacy_grandfathered",
                        "current_payment_id": None,
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
                {"$unset": "email"},
            ],
        )
        print(f"Migrated {legacy_count} legacy doc(s) → new schema.")

    # Ensure indexes (safe & idempotent).
    coll.create_index("user_email", unique=True, sparse=True)
    db.payments.create_index("user_email")
    db.payments.create_index("razorpay_order_id", unique=True)
    print("Indexes ensured.")

    # Sanity check: any docs still without user_email?
    orphans = coll.count_documents({"user_email": {"$exists": False}})
    if orphans > 0:
        print(f"WARNING: {orphans} doc(s) without user_email remain — "
              f"investigate manually before launching payments.")
    else:
        print("All subscriber docs have user_email. Migration complete.")


if __name__ == "__main__":
    migrate()
