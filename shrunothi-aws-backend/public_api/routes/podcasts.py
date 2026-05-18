from flask import Blueprint, jsonify
from db.client import get_db
from db.models.podcast import serialize_podcast
from extensions import limiter
from utils.soft_delete import not_deleted_filter

bp = Blueprint("public_podcasts", __name__)

@bp.route("/podcasts", methods=["GET"])
@limiter.limit("500 per minute")
def list_podcasts():
    db = get_db()
    docs = db.podcasts.find(not_deleted_filter())
    return jsonify([serialize_podcast(d) for d in docs]), 200
