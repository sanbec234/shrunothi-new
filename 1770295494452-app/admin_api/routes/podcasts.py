from flask import Blueprint, request, jsonify, current_app
from db.client import get_db
from db.models.podcast import create_podcast
from bson import ObjectId
from datetime import datetime
from auth.auth_guard import require_admin
from pymongo.errors import DuplicateKeyError

bp = Blueprint("admin_podcasts", __name__)
SUPPORTED_LANGUAGES = {"English", "Hindi", "Tamil"}
MAX_TITLE_LEN = 300
MAX_SPOTIFY_URL_LEN = 500


def normalized_language(raw_value):
    language = (raw_value or "").strip() or "English"
    return language


def normalize_payload(data):
    return {
        "title": (data.get("title") or "").strip(),
        "spotifyUrl": (data.get("spotifyUrl") or "").strip(),
        "genreId": (data.get("genreId") or "").strip(),
        "language": normalized_language(data.get("language")),
    }


def validate_payload(payload):
    if not payload["title"]:
        return "title is required"
    if len(payload["title"]) > MAX_TITLE_LEN:
        return f"title is too long (max {MAX_TITLE_LEN} characters)"

    if not payload["spotifyUrl"]:
        return "spotifyUrl is required"
    if len(payload["spotifyUrl"]) > MAX_SPOTIFY_URL_LEN:
        return f"spotifyUrl is too long (max {MAX_SPOTIFY_URL_LEN} characters)"

    if not payload["genreId"]:
        return "genreId is required"

    if payload["language"] not in SUPPORTED_LANGUAGES:
        return "language must be one of: English, Hindi, Tamil"

    return None

# -------------------------------
# ADD PODCAST
# POST /admin/podcasts
# -------------------------------
@bp.route("/admin/podcasts", methods=["POST"])
@require_admin
def add_podcast():
    payload = normalize_payload(request.get_json() or {})
    validation_error = validate_payload(payload)
    if validation_error:
        return jsonify({"error": validation_error}), 400

    db = get_db()

    duplicate = db.podcasts.find_one(
        {
            "title": payload["title"],
            "spotifyUrl": payload["spotifyUrl"],
            "genreId": payload["genreId"],
        }
    )
    if duplicate:
        return jsonify({"error": "Podcast with same title and URL already exists in this genre"}), 409

    try:
        podcast_id = create_podcast(db, payload)
        return jsonify({
            "id": str(podcast_id),
            "title": payload["title"],
            "language": payload["language"],
        }), 201
    except DuplicateKeyError:
        return jsonify({"error": "Podcast already exists"}), 409
    except Exception:
        current_app.logger.exception("Failed to create podcast")
        return jsonify({"error": "Failed to create podcast"}), 500


# -------------------------------
# UPDATE PODCAST
# PUT or PATCH /admin/podcasts/<id>
# -------------------------------
@bp.route("/admin/podcasts/<podcast_id>", methods=["PUT", "PATCH"])
@require_admin
def update_podcast(podcast_id):
    try:
        pid = ObjectId(podcast_id)
    except Exception:
        return jsonify({"error": "Invalid podcast id"}), 400

    payload = normalize_payload(request.get_json() or {})
    validation_error = validate_payload(payload)
    if validation_error:
        return jsonify({"error": validation_error}), 400

    db = get_db()

    # Validate genreId
    try:
        genre_oid = ObjectId(payload["genreId"])
    except Exception:
        return jsonify({"error": "Invalid genreId"}), 400

    genre = db.genres.find_one({ "_id": genre_oid })
    if not genre:
        return jsonify({"error": "Genre not found"}), 400

    duplicate = db.podcasts.find_one(
        {
            "_id": {"$ne": pid},
            "title": payload["title"],
            "spotifyUrl": payload["spotifyUrl"],
            "genreId": payload["genreId"],
        }
    )
    if duplicate:
        return jsonify({"error": "Another podcast with same title and URL already exists in this genre"}), 409

    try:
        result = db.podcasts.update_one(
            { "_id": pid },
            {
                "$set": {
                    "title": payload["title"],
                    "spotifyUrl": payload["spotifyUrl"],
                    "genreId": payload["genreId"],  # keep as string
                    "language": payload["language"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
    except DuplicateKeyError:
        return jsonify({"error": "Podcast already exists"}), 409
    except Exception:
        current_app.logger.exception("Failed to update podcast")
        return jsonify({"error": "Failed to update podcast"}), 500

    if result.matched_count == 0:
        return jsonify({"error": "Podcast not found"}), 404

    return jsonify({ "status": "updated" }), 200


# -------------------------------
# DELETE PODCAST
# DELETE /admin/podcasts/<id>
# -------------------------------
@bp.route("/admin/podcasts/<podcast_id>", methods=["DELETE", "OPTIONS"])
@require_admin
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
