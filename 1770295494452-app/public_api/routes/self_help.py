from flask import Blueprint, jsonify
from db.client import get_db
from db.models.self_help import serialize_self_help
from extensions import limiter

bp = Blueprint("public_self_help", __name__)

@bp.route("/self-help", methods=["GET"])
@limiter.limit("500 per minute")
def list_self_help():
    db = get_db()
    docs = db.self_help.find()
    return jsonify([serialize_self_help(d) for d in docs]), 200
