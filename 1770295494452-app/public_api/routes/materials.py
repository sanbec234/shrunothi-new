from flask import Blueprint, jsonify
from db.client import get_db
from db.models.material import serialize_material
from bson import ObjectId
from extensions import limiter

bp = Blueprint("public_materials", __name__)

@bp.route("/materials", methods=["GET"])
@limiter.limit("500 per minute")
def list_materials():
    db = get_db()
    docs = db.materials.find()
    return jsonify([serialize_material(d) for d in docs]), 200

@bp.route("/genres/<genre_id>/material", methods=["GET"])
@limiter.limit("500 per minute")
def get_materials_by_genre(genre_id):
    db = get_db()

    docs = db.materials.find({
        "$or": [
            { "genreId": genre_id },
            { "genreId": ObjectId(genre_id) }
        ]
    })

    return jsonify([serialize_material(d) for d in docs]), 200