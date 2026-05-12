from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from db.client import get_db
from auth.auth_guard import require_admin

bp = Blueprint("admin_users", __name__)


@bp.route("/admin/users", methods=["GET"])
@require_admin
def list_users():
    db = get_db()

    try:
        limit = min(max(int(request.args.get("limit", 50)), 1), 200)
        offset = max(int(request.args.get("offset", 0)), 0)
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters"}), 400

    cursor = db.users.find().sort("created_at", -1).skip(offset).limit(limit)
    total = db.users.count_documents({})

    users = [
        {
            "id": str(u["_id"]),
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "role": u.get("role", "user"),
            "created_at": u.get("created_at"),
            "last_login": u.get("last_login"),
        }
        for u in cursor
    ]

    return jsonify({"users": users, "total": total, "limit": limit, "offset": offset}), 200


@bp.route("/admin/paid-users", methods=["GET"])
@require_admin
def list_paid_users():
    db = get_db()

    now = datetime.now(timezone.utc)

    # Fetch all active subscribers (not expired)
    cursor = db.subscribers.find(
        {"subscription_status": "active"}
    ).sort("started_at", -1)

    paid_users = []
    for sub in cursor:
        expires_at = sub.get("expires_at")

        # Skip expired subscriptions
        if expires_at:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < now:
                continue

        email = sub.get("user_email", "")

        # Look up user name from users collection
        user_doc = db.users.find_one({"email": email})
        name = user_doc.get("name", "") if user_doc else ""

        paid_users.append({
            "email": email,
            "name": name,
            "subscription_tier": sub.get("subscription_tier", "standard"),
            "payment_type": sub.get("payment_type", ""),
            "started_at": sub.get("started_at").isoformat() if sub.get("started_at") else None,
            "expires_at": expires_at.isoformat() if expires_at else None,
        })

    return jsonify({"paid_users": paid_users, "total": len(paid_users)}), 200
