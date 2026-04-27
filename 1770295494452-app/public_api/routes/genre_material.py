from flask import Blueprint, jsonify
from db.client import get_db
from bson import ObjectId
from extensions import limiter

bp = Blueprint("public_genre_material", __name__)

@bp.route("/genres/<genre_id>/material", methods=["GET"])
@limiter.limit("500 per minute")
def genre_material(genre_id):
    db = get_db()

    docs = db.materials.find({ "genreId": genre_id })

    materials = []
    for d in docs:
        materials.append({
            "id": str(d["_id"]),
            "title": d["title"],   # frontend expects `title`
            "author": d.get("author", "Unknown")
        })

    return jsonify(materials), 200
