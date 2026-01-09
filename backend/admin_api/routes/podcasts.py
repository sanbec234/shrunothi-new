from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.podcast import create_podcast
from bson import ObjectId
from datetime import datetime

bp = Blueprint("admin_podcasts", __name__)

# -------------------------------
# ADD PODCAST
# POST /admin/podcasts
# -------------------------------
@bp.route("/admin/podcasts", methods=["POST"])
def add_podcast():
    data = request.get_json() or {}

    required = ["title", "spotifyUrl", "genreId"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    db = get_db()
    podcast_id = create_podcast(db, data)

    return jsonify({
        "id": str(podcast_id),
        "title": data["title"]
    }), 201


# -------------------------------
# UPDATE PODCAST
# PUT or PATCH /admin/podcasts/<id>
# -------------------------------
@bp.route("/admin/podcasts/<podcast_id>", methods=["PUT", "PATCH"])
def update_podcast(podcast_id):
    db = get_db()

    try:
        pid = ObjectId(podcast_id)
    except Exception:
        return jsonify({"error": "Invalid podcast id"}), 400

    data = request.get_json() or {}

    required = ["title", "spotifyUrl", "genreId"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    # Validate genreId
    try:
        genre_oid = ObjectId(data["genreId"])
    except Exception:
        return jsonify({"error": "Invalid genreId"}), 400

    genre = db.genres.find_one({ "_id": genre_oid })
    if not genre:
        return jsonify({"error": "Genre not found"}), 400

    result = db.podcasts.update_one(
        { "_id": pid },
        {
            "$set": {
                "title": data["title"],
                # "author": data["author"],
                "spotifyUrl": data["spotifyUrl"],
                "genreId": data["genreId"],  # keep as string
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        return jsonify({"error": "Podcast not found"}), 404

    return jsonify({ "status": "updated" }), 200


# -------------------------------
# DELETE PODCAST
# DELETE /admin/podcasts/<id>
# -------------------------------
@bp.route("/admin/podcasts/<podcast_id>", methods=["DELETE", "OPTIONS"])
def delete_podcast(podcast_id):
    if request.method == "OPTIONS":
        return "", 200

    db = get_db()

    try:
        oid = ObjectId(podcast_id)
    except Exception:
        return jsonify({"error": "Invalid podcast id"}), 400

    result = db.podcasts.delete_one({ "_id": oid })

    if result.deleted_count == 0:
        return jsonify({"error": "Podcast not found"}), 404

    return jsonify({ "status": "deleted" }), 200