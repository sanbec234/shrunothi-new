from flask import Blueprint, jsonify
from db.client import get_db


bp = Blueprint("public_coaches", __name__)


@bp.route("/coaches", methods=["GET"])
def get_coaches():
    db = get_db()
    docs = list(db.coaches.find().sort("order", 1))
    return jsonify([
        {
            "id": str(doc["_id"]),
            "name": doc.get("name", ""),
            "title": doc.get("title", ""),
            "image_url": doc.get("image_url", ""),
        }
        for doc in docs
    ]), 200
