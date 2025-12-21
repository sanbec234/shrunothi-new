from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.genre import create_genre
from bson import ObjectId

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

@bp.route("/admin/genres/<genre_id>", methods=["PATCH", "OPTIONS"])
def update_genre(genre_id):
    if request.method == "OPTIONS":
        return "", 200

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

@bp.route("/admin/genres/<genre_id>", methods=["DELETE", "OPTIONS"])
def delete_genre(genre_id):
    if request.method == "OPTIONS":
        return "", 200

    db = get_db()

    try:
        oid = ObjectId(genre_id)
    except Exception:
        return jsonify({ "error": "Invalid genre id" }), 400

    if db.podcasts.count_documents({ "genreId": oid }) > 0:
        return jsonify({ "error": "Genre has podcasts" }), 400

    if db.materials.count_documents({ "genreId": oid }) > 0:
        return jsonify({ "error": "Genre has materials" }), 400

    result = db.genres.delete_one({ "_id": oid })

    if result.deleted_count == 0:
        return jsonify({ "error": "Genre not found" }), 404

    return jsonify({ "status": "deleted" }), 200
