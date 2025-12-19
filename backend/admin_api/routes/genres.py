from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.genre import create_genre

bp = Blueprint("admin_genres", __name__)

@bp.route("/admin/genres", methods=["POST"])
def add_genre():
    data = request.get_json() or {}
    name = data.get("name", "").strip()

    if not name:
        return jsonify({"error": "name is required"}), 400

    db = get_db()
    genre_id = create_genre(db, name)

    return jsonify({
        "id": str(genre_id),
        "name": name
    }), 201
