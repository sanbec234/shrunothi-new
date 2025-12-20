from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.self_help import create_self_help

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
