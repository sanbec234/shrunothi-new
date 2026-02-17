from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.self_help import create_self_help
from bson import ObjectId
from datetime import datetime
from auth.auth_guard import require_admin

bp = Blueprint("admin_self_help", __name__)

# -------------------------------
# ADD SELF-HELP
# POST /admin/self-help
# -------------------------------
@bp.route("/admin/self-help", methods=["POST"])
@require_admin
def add_self_help():
    data = request.get_json() or {}

    required = ["title", "author", "content"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    db = get_db()
    doc_id = create_self_help(db, data)

    return jsonify({
        "id": str(doc_id),
        "title": data["title"]
    }), 201


# -------------------------------
# UPDATE SELF-HELP
# PUT or PATCH /admin/self-help/<id>
# -------------------------------
@bp.route("/admin/self-help/<self_help_id>", methods=["PUT", "PATCH"])
@require_admin
def update_self_help(self_help_id):
    db = get_db()

    try:
        oid = ObjectId(self_help_id)
    except Exception:
        return jsonify({ "error": "Invalid self-help id" }), 400

    data = request.get_json() or {}

    # Required fields
    for field in ["title", "author", "content"]:
        if not data.get(field):
            return jsonify({ "error": f"{field} is required" }), 400

    result = db.self_help.update_one(
        { "_id": oid },
        { "$set": {
            "title": data["title"],
            "author": data["author"],
            "content": data["content"],
            "updated_at": datetime.utcnow()
        }}
    )

    if result.matched_count == 0:
        return jsonify({ "error": "Self-help not found" }), 404

    return jsonify({ "status": "updated" }), 200


# -------------------------------
# DELETE SELF-HELP
# DELETE /admin/self-help/<id>
# -------------------------------
@bp.route("/admin/self-help/<self_help_id>", methods=["DELETE", "OPTIONS"])
@require_admin
def delete_self_help(self_help_id):
    if request.method == "OPTIONS":
        return "", 200

    db = get_db()

    try:
        oid = ObjectId(self_help_id)
    except Exception:
        return jsonify({ "error": "Invalid self-help id" }), 400

    result = db.self_help.delete_one({ "_id": oid })

    if result.deleted_count == 0:
        return jsonify({ "error": "Self-help not found" }), 404

    return jsonify({ "status": "deleted" }), 200