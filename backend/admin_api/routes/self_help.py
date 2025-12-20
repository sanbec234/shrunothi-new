from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.self_help import create_self_help
from bson import ObjectId

bp = Blueprint("admin_self_help", __name__)

@bp.route("/admin/self-help", methods=["POST"])
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

@bp.route("/admin/self-help/<self_help_id>", methods=["PATCH", "OPTIONS"])
def update_self_help(self_help_id):
    if request.method == "OPTIONS":
        return "", 200

    db = get_db()

    try:
        oid = ObjectId(self_help_id)
    except Exception:
        return jsonify({ "error": "Invalid self-help id" }), 400

    data = request.get_json() or {}

    update = {
        k: v for k, v in data.items()
        if k in ["title", "author", "content"] and v
    }

    if not update:
        return jsonify({ "error": "Nothing to update" }), 400

    result = db.self_help.update_one(
        { "_id": oid },
        { "$set": update }
    )

    if result.matched_count == 0:
        return jsonify({ "error": "Self-help not found" }), 404

    return jsonify({ "status": "updated" }), 200