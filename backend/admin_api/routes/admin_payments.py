"""
Admin payment management routes.

All endpoints require admin authentication. Provides:
- Dashboard view of all transactions (paginated, filterable)
- Individual order detail with full event audit trail
- Summary statistics (total revenue, active subscribers, etc.)
"""

import logging
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify

from auth.auth_guard import require_admin
from extensions import limiter
from db.client import get_db
from db.models.payment import (
    serialize_payment_internal,
    get_payment_events,
)

bp = Blueprint("admin_payments", __name__, url_prefix="/admin/payments")
log = logging.getLogger(__name__)


@bp.route("/", methods=["GET"])
@limiter.limit("60 per minute")
@require_admin
def list_payments():
    """
    Paginated list of all payments with optional filters.

    Query params:
        status   – filter by payment status (created, authorized, captured, failed, refunded)
        email    – filter by user email (case-insensitive partial match)
        limit    – page size (default 25, max 100)
        offset   – pagination offset (default 0)
        sort     – "newest" (default) or "oldest"
    """
    db = get_db()

    try:
        limit = min(max(int(request.args.get("limit", 25)), 1), 100)
        offset = max(int(request.args.get("offset", 0)), 0)
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters"}), 400

    query = {}

    status_filter = request.args.get("status")
    if status_filter:
        valid_statuses = {"created", "authorized", "captured", "failed", "refunded"}
        if status_filter not in valid_statuses:
            return jsonify({"error": f"Invalid status. Must be one of: {', '.join(sorted(valid_statuses))}"}), 400
        query["status"] = status_filter

    email_filter = request.args.get("email")
    if email_filter:
        # Case-insensitive partial match for admin search.
        query["user_email"] = {"$regex": email_filter.lower().strip(), "$options": "i"}

    sort_dir = -1 if request.args.get("sort", "newest") == "newest" else 1

    total = db.payments.count_documents(query)
    cursor = (
        db.payments.find(query)
        .sort("created_at", sort_dir)
        .skip(offset)
        .limit(limit)
    )

    payments = [serialize_payment_internal(doc) for doc in cursor]

    return jsonify({
        "payments": payments,
        "total": total,
        "limit": limit,
        "offset": offset,
    }), 200


@bp.route("/<order_id>", methods=["GET"])
@limiter.limit("60 per minute")
@require_admin
def get_payment_detail(order_id):
    """
    Full detail for a single payment including its immutable event audit trail.
    """
    db = get_db()

    payment = db.payments.find_one({"razorpay_order_id": order_id})
    if not payment:
        return jsonify({"error": "Payment not found"}), 404

    events = get_payment_events(order_id)
    serialized_events = []
    for evt in events:
        serialized_events.append({
            "event": evt.get("event"),
            "status": evt.get("status"),
            "razorpay_payment_id": evt.get("razorpay_payment_id"),
            "timestamp": evt["timestamp"].isoformat() if evt.get("timestamp") else None,
        })

    result = serialize_payment_internal(payment)
    result["events"] = serialized_events

    # Include subscriber status if available.
    subscriber = db.subscribers.find_one({"user_email": payment.get("user_email")})
    if subscriber:
        result["subscription_status"] = subscriber.get("subscription_status")
        result["subscription_expires_at"] = (
            subscriber["expires_at"].isoformat() if subscriber.get("expires_at") else None
        )

    return jsonify(result), 200


@bp.route("/stats", methods=["GET"])
@limiter.limit("30 per minute")
@require_admin
def payment_stats():
    """
    Aggregate statistics for the admin dashboard.

    Returns: total revenue, payment counts by status, active subscriber count,
    revenue by plan type.
    """
    db = get_db()

    # Payment counts by status.
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    status_counts = {
        doc["_id"]: doc["count"]
        for doc in db.payments.aggregate(status_pipeline)
    }

    # Total captured revenue.
    revenue_pipeline = [
        {"$match": {"status": "captured"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    revenue_result = list(db.payments.aggregate(revenue_pipeline))
    total_revenue_paise = revenue_result[0]["total"] if revenue_result else 0

    # Revenue by plan type.
    plan_revenue_pipeline = [
        {"$match": {"status": "captured"}},
        {"$group": {
            "_id": "$payment_type",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1},
        }},
    ]
    plan_revenue = {
        doc["_id"]: {"total_paise": doc["total"], "count": doc["count"]}
        for doc in db.payments.aggregate(plan_revenue_pipeline)
    }

    # Active subscribers.
    active_subscribers = db.subscribers.count_documents({
        "subscription_status": "active",
    })

    return jsonify({
        "total_revenue_paise": total_revenue_paise,
        "total_revenue_inr": total_revenue_paise / 100,
        "status_counts": status_counts,
        "plan_revenue": plan_revenue,
        "active_subscribers": active_subscribers,
    }), 200


@bp.route("/subscribers", methods=["GET"])
@limiter.limit("60 per minute")
@require_admin
def list_subscribers():
    """
    Paginated list of all subscribers with their current status.
    """
    db = get_db()

    try:
        limit = min(max(int(request.args.get("limit", 25)), 1), 100)
        offset = max(int(request.args.get("offset", 0)), 0)
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters"}), 400

    status_filter = request.args.get("status")
    query = {}
    if status_filter:
        query["subscription_status"] = status_filter

    total = db.subscribers.count_documents(query)
    cursor = (
        db.subscribers.find(query)
        .sort("updated_at", -1)
        .skip(offset)
        .limit(limit)
    )

    subscribers = []
    for doc in cursor:
        subscribers.append({
            "user_email": doc.get("user_email"),
            "subscription_status": doc.get("subscription_status"),
            "subscription_tier": doc.get("subscription_tier"),
            "payment_type": doc.get("payment_type"),
            "current_payment_id": doc.get("current_payment_id"),
            "started_at": doc["started_at"].isoformat() if doc.get("started_at") else None,
            "expires_at": doc["expires_at"].isoformat() if doc.get("expires_at") else None,
            "updated_at": doc["updated_at"].isoformat() if doc.get("updated_at") else None,
        })

    return jsonify({
        "subscribers": subscribers,
        "total": total,
        "limit": limit,
        "offset": offset,
    }), 200
