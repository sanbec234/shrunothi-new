from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.podcast import create_podcast

bp = Blueprint("admin_podcasts", __name__)

@bp.route("/admin/podcasts", methods=["POST"])
def add_podcast():
    data = request.get_json() or {}

    required = ["title", "author", "spotifyUrl", "genreId"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    db = get_db()
    podcast_id = create_podcast(db, data)

    return jsonify({
        "id": str(podcast_id),
        "title": data["title"]
    }), 201
