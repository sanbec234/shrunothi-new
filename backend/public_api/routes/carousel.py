from flask import Blueprint, jsonify
from db.client import get_db


bp = Blueprint("public_carousel", __name__)


@bp.route("/carousel", methods=["GET"])
def get_active_carousel_banners():
    db = get_db()
    docs = list(db.carousel_banners.find({"active": True}).sort("order", 1))
    return jsonify([
        {
            "id": str(doc["_id"]),
            "image_url": doc.get("image_url", ""),
            "order": doc.get("order", 0),
        }
        for doc in docs
    ]), 200
