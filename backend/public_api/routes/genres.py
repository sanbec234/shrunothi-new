from flask import Blueprint, jsonify
from db.client import get_db
from db.models.genre import serialize_genre

bp = Blueprint("public_genres", __name__)

@bp.route("/genres", methods=["GET"])
def list_genres():
    db = get_db()
    docs = db.genres.find().sort("name", 1)
    return jsonify([serialize_genre(d) for d in docs]), 200
