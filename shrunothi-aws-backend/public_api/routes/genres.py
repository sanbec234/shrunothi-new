from flask import Blueprint, jsonify
from db.client import get_db
from db.models.genre import serialize_genre
from extensions import limiter
from utils.soft_delete import not_deleted_filter

bp = Blueprint("public_genres", __name__)

@bp.route("/genres", methods=["GET"])
@limiter.limit("500 per minute")
def list_genres():
    db = get_db()
    docs = db.genres.find(not_deleted_filter()).sort("name", 1)
    return jsonify([serialize_genre(d) for d in docs]), 200
