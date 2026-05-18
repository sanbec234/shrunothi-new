from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.genre import create_genre
from bson import ObjectId
from auth.auth_guard import require_admin
from utils.soft_delete import soft_delete, not_deleted_filter
from utils.audit import audit_log

bp = Blueprint("admin_genres", __name__)

# -------------------------------
# ADD GENRE
# POST /admin/genres
# -------------------------------
@bp.route("/admin/genres", methods=["POST"])
@require_admin
@audit_log("genre.create")
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


# -------------------------------
# UPDATE GENRE
# PUT or PATCH /admin/genres/<id>
# -------------------------------
@bp.route("/admin/genres/<genre_id>", methods=["PUT", "PATCH"])
@require_admin
@audit_log("genre.update")
def update_genre(genre_id):
    db = get_db()

    try:
        oid = ObjectId(genre_id)
    except Exception:
        return jsonify({ "error": "Invalid genre id" }), 400

    data = request.get_json() or {}
    name = data.get("name", "").strip()

    if not name:
        return jsonify({ "error": "Name required" }), 400

    result = db.genres.update_one(
        { "_id": oid },
        { "$set": { "name": name } }
    )

    if result.matched_count == 0:
        return jsonify({ "error": "Genre not found" }), 404

    return jsonify({ "status": "updated", "name": name }), 200


# -------------------------------
# DELETE GENRE
# DELETE /admin/genres/<id>
# -------------------------------
@bp.route("/admin/genres/<genre_id>", methods=["DELETE", "OPTIONS"])
@require_admin
@audit_log("genre.delete")
def delete_genre(genre_id):
    if request.method == "OPTIONS":
        return "", 200

    db = get_db()

    try:
        oid = ObjectId(genre_id)
    except Exception:
        return jsonify({ "error": "Invalid genre id" }), 400

    # 🔒 Block delete if podcasts exist (only count live ones)
    if db.podcasts.count_documents({
        **not_deleted_filter(),
        "$or": [
            { "genreId": oid },
            { "genreId": genre_id }  # legacy string
        ]
    }) > 0:
        return jsonify({ "error": "Genre has podcasts" }), 400

    # 🔒 Block delete if materials exist (only count live ones)
    if db.materials.count_documents({
        **not_deleted_filter(),
        "$or": [
            { "genreId": oid },
            { "genreId": genre_id }
        ]
    }) > 0:
        return jsonify({ "error": "Genre has materials" }), 400

    actor = (request.user or {}).get("email") if hasattr(request, "user") else None
    if not soft_delete(db.genres, oid, actor):
        existing = db.genres.find_one({"_id": oid})
        if not existing:
            return jsonify({ "error": "Genre not found" }), 404
        return jsonify({ "status": "already_deleted" }), 200

    return jsonify({ "status": "deleted", "recoverable": True }), 200