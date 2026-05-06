#!/usr/bin/env python3
"""
Payment reconciliation & cleanup script.

Run manually or via a cron job / Railway scheduled task:
    python -m scripts.payment_reconciliation

What it does:
1. Stuck "authorized" orders (>1 hour old) — fetches status from Razorpay:
   - If captured on Razorpay → activates subscription
   - If failed/expired → marks as failed locally
   - If still authorized → logs warning (Razorpay auto-refunds after 5 days)

2. Orphaned "created" orders (>24 hours old) — marks as expired locally.
   These are orders where the user opened checkout but never completed payment.

3. Expired subscriptions — checks monthly subscribers whose expires_at is past
   and marks their subscription as expired.

Safe to run repeatedly — all operations are idempotent.
"""

import logging
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Ensure the backend root is on sys.path for imports.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env", override=True)

from db.client import get_db
from config.razorpay_config import get_razorpay_client
from db.models.subscriber import create_subscription
from db.models.payment import update_payment_status, _append_payment_event

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("reconciliation")


def reconcile_stuck_authorized(db, dry_run=False):
    """
    Find orders stuck in 'authorized' for >1 hour and resolve them
    by checking Razorpay's actual status.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    stuck = list(db.payments.find({
        "status": "authorized",
        "created_at": {"$lt": cutoff},
    }))

    log.info("Found %d stuck authorized orders", len(stuck))

    for payment in stuck:
        order_id = payment["razorpay_order_id"]
        rp_payment_id = payment.get("razorpay_payment_id")

        if not rp_payment_id:
            log.warning("No razorpay_payment_id for order %s — skipping", order_id)
            continue

        try:
            rp_payment = get_razorpay_client().payment.fetch(rp_payment_id)
            rp_status = rp_payment.get("status")
        except Exception:
            log.exception("Failed to fetch payment %s from Razorpay", rp_payment_id)
            continue

        log.info("Order %s: local=authorized, razorpay=%s", order_id, rp_status)

        if dry_run:
            continue

        if rp_status == "captured":
            update_payment_status(
                razorpay_payment_id=rp_payment_id,
                status="captured",
                razorpay_order_id=order_id,
                metadata={"reconciled": True, "source": "reconciliation_script"},
            )
            # Activate subscription.
            payment_type = payment.get("payment_type", "one_time")
            expires_at = (
                datetime.now(timezone.utc) + timedelta(days=30)
                if payment_type == "recurring"
                else None
            )
            create_subscription(
                db=db,
                email=payment["user_email"],
                payment_id=order_id,
                payment_type=payment_type,
                expires_at=expires_at,
            )
            log.info("Reconciled → captured + subscription: order=%s", order_id)

        elif rp_status in ("failed", "expired"):
            update_payment_status(
                razorpay_payment_id=rp_payment_id,
                status="failed",
                razorpay_order_id=order_id,
                metadata={"reconciled": True, "razorpay_status": rp_status},
            )
            log.info("Reconciled → failed: order=%s (razorpay=%s)", order_id, rp_status)

        else:
            log.warning(
                "Order %s still authorized on Razorpay (status=%s) — "
                "Razorpay will auto-refund after 5 days",
                order_id, rp_status,
            )


def cleanup_orphaned_orders(db, dry_run=False):
    """
    Mark 'created' orders older than 24 hours as 'expired'.
    These are checkout sessions that were never completed.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    orphaned = list(db.payments.find({
        "status": "created",
        "created_at": {"$lt": cutoff},
    }))

    log.info("Found %d orphaned 'created' orders (>24h old)", len(orphaned))

    if dry_run:
        return

    for payment in orphaned:
        order_id = payment["razorpay_order_id"]
        db.payments.update_one(
            {"razorpay_order_id": order_id, "status": "created"},
            {"$set": {"status": "expired"}},
        )
        _append_payment_event(
            db=db,
            order_id=order_id,
            event="payment.expired",
            status="expired",
            metadata={"source": "reconciliation_script", "reason": "orphaned_24h"},
        )
        log.info("Expired orphaned order: %s", order_id)


def expire_lapsed_subscriptions(db, dry_run=False):
    """
    Find monthly subscribers whose expires_at is in the past and mark them expired.
    """
    now = datetime.now(timezone.utc)
    lapsed = list(db.subscribers.find({
        "subscription_status": "active",
        "expires_at": {"$lt": now, "$ne": None},
    }))

    log.info("Found %d lapsed subscriptions", len(lapsed))

    if dry_run:
        return

    for sub in lapsed:
        db.subscribers.update_one(
            {"user_email": sub["user_email"], "subscription_status": "active"},
            {"$set": {"subscription_status": "expired", "updated_at": now}},
        )
        log.info("Expired subscription: %s", sub["user_email"])


def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        log.info("=== DRY RUN MODE — no changes will be made ===")

    db = get_db()

    log.info("Starting payment reconciliation...")
    reconcile_stuck_authorized(db, dry_run=dry_run)

    log.info("Cleaning up orphaned orders...")
    cleanup_orphaned_orders(db, dry_run=dry_run)

    log.info("Checking for lapsed subscriptions...")
    expire_lapsed_subscriptions(db, dry_run=dry_run)

    log.info("Reconciliation complete.")


if __name__ == "__main__":
    main()
