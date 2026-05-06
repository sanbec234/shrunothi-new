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
