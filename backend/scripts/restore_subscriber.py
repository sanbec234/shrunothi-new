"""
Restore a subscriber record that was incorrectly expired or cleared.

Usage:
    cd backend
    python -m scripts.restore_subscriber shrunothi@gmail.com [--plan monthly|annual]

Without --plan it reads the existing payment history to determine the correct plan.
Defaults to 'annual' (no expiry) if it cannot determine.

Safe to run on an already-active subscriber — it will only upgrade, never downgrade.
"""

import sys
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env", override=True)

from db.client import get_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("restore_subscriber")


def restore(email: str, plan: str = "auto"):
    db = get_db()
    email = email.lower().strip()

    # ── Show current state ──────────────────────────────────────────
    sub = db.subscribers.find_one({"user_email": email})
    if sub:
        log.info("Current record for %s:", email)
        log.info("  status      : %s", sub.get("subscription_status"))
        log.info("  payment_type: %s", sub.get("payment_type"))
        log.info("  expires_at  : %s", sub.get("expires_at"))
        log.info("  started_at  : %s", sub.get("started_at"))
    else:
        log.info("No existing subscriber record found for %s — will create one.", email)

    # ── Determine payment_type from history if plan == "auto" ───────
    if plan == "auto":
        payment_type = sub.get("payment_type") if sub else None
        if not payment_type or payment_type == "legacy_grandfathered":
            # Fall back to most recent captured payment
            recent_payment = db.payments.find_one(
                {"user_email": email, "status": "captured"},
                sort=[("created_at", -1)],
            )
            if recent_payment:
                payment_type = recent_payment.get("payment_type", "one_time")
                log.info("Determined payment_type from payment history: %s", payment_type)
            else:
                payment_type = "one_time"
                log.warning(
                    "No captured payment found — defaulting to 'one_time' (annual/lifetime). "
                    "Pass --plan monthly if this is wrong."
                )
    else:
        payment_type = "recurring" if plan == "monthly" else "one_time"

    # ── Compute correct expires_at ──────────────────────────────────
    if payment_type == "recurring":
        # Monthly: give them a fresh 30-day window from now
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        log.info("Monthly plan → expires_at: %s", expires_at.isoformat())
    else:
        # Annual / one-time / legacy: no expiry
        expires_at = None
        log.info("Annual/one-time plan → expires_at: None (lifetime access)")

    # ── Find a reference payment_id ────────────────────────────────
    ref_payment = db.payments.find_one(
        {"user_email": email, "status": "captured"},
        sort=[("created_at", -1)],
    )
    payment_id = ref_payment["razorpay_order_id"] if ref_payment else "admin_restore"

    # ── Upsert subscriber record ────────────────────────────────────
    now = datetime.now(timezone.utc)
    result = db.subscribers.update_one(
        {"user_email": email},
        {
            "$setOnInsert": {
                "user_email": email,
                "started_at": now,
                "created_at": now,
            },
            "$set": {
                "subscription_status": "active",
                "subscription_tier": "standard",
                "payment_type": payment_type,
                "expires_at": expires_at,
                "current_payment_id": payment_id,
                "updated_at": now,
                "_restore_note": f"Manually restored by admin script on {now.date()}",
            },
        },
        upsert=True,
    )

    action = "created" if result.upserted_id else "updated"
    log.info("Subscriber record %s successfully for %s", action, email)

    # ── Verify ─────────────────────────────────────────────────────
    final = db.subscribers.find_one({"user_email": email})
    log.info("Verified final state:")
    log.info("  status      : %s", final.get("subscription_status"))
    log.info("  payment_type: %s", final.get("payment_type"))
    log.info("  expires_at  : %s", final.get("expires_at"))
    log.info("Done — %s now has active subscription.", email)


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = sys.argv[1:]

    if not args:
        print("Usage: python -m scripts.restore_subscriber <email> [--plan monthly|annual]")
        sys.exit(1)

    target_email = args[0]
    plan_flag = "auto"
    if "--plan" in flags:
        idx = flags.index("--plan")
        if idx + 1 < len(flags):
            plan_flag = flags[idx + 1]

    restore(target_email, plan=plan_flag)
