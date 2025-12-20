from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.podcast import create_podcast
from bson import ObjectId
from datetime import datetime

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

@bp.route("/admin/podcasts/<podcast_id>", methods=["PATCH"])
def update_podcast(podcast_id):
    db = get_db()

    try:
        pid = ObjectId(podcast_id)
    except Exception:
        return jsonify({"error": "Invalid podcast id"}), 400

    data = request.get_json() or {}
    print("EDIT PODCAST PAYLOAD:", data)

    genre_id = data.get("genreId")
    if genre_id:
        try:
            data["genreId"] = ObjectId(genre_id)
        except Exception:
            return jsonify({ "error": "Invalid genreId" }), 400

    # Required fields
    for field in ["title", "author", "spotifyUrl", "genreId"]:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    # ✅ Validate genre EXISTS (but keep genreId as string)
    try:
        genre = db.genres.find_one({ "_id": ObjectId(data["genreId"]) })
    except Exception:
        return jsonify({"error": "Invalid genre id"}), 400

    if not genre:
        return jsonify({"error": "Genre not found"}), 400

    result = db.podcasts.update_one(
        { "_id": pid },
        { "$set": {
            "title": data["title"],
            "author": data["author"],
            "spotifyUrl": data["spotifyUrl"],
            "genreId": data["genreId"],  # ✅ KEEP STRING
            "updated_at": datetime.utcnow()
        }}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Podcast not found"}), 404

    return jsonify({ "status": "updated" }), 200

