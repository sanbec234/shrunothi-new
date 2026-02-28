from flask import Blueprint, jsonify
from db.client import get_db
from auth.auth_guard import require_admin
bp = Blueprint("admin_users", __name__)

@bp.route("/admin/users", methods=["GET"])
@require_admin
def list_users():
    db = get_db()

    docs = db.users.find().sort("created_at", -1)

    users = []
    for u in docs:
        users.append({
            "id": str(u["_id"]),
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "role": u.get("role", "user"),
            "created_at": u.get("created_at"),
            "last_login": u.get("last_login")
        })

    return jsonify(users), 200