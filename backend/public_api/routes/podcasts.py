from flask import Blueprint, jsonify
from db.client import get_db
from db.models.podcast import serialize_podcast

bp = Blueprint("public_podcasts", __name__)

@bp.route("/podcasts", methods=["GET"])
def list_podcasts():
    db = get_db()
    docs = db.podcasts.find()
    return jsonify([serialize_podcast(d) for d in docs]), 200
