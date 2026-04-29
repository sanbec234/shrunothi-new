from flask import Blueprint, jsonify
from db.client import get_db
from db.models.podcast import serialize_podcast
from extensions import limiter

bp = Blueprint("public_podcasts", __name__)

@bp.route("/podcasts", methods=["GET"])
@limiter.limit("500 per minute")
def list_podcasts():
    db = get_db()
    docs = db.podcasts.find()
    return jsonify([serialize_podcast(d) for d in docs]), 200
