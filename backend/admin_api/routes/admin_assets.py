from flask import Blueprint, request, jsonify, current_app
from ..db.models.assets import create_asset

bp = Blueprint("admin_assets", __name__)


@bp.route("/admin/assets", methods=["POST"])
def add_asset():
    data = request.get_json()

    if not data or "title" not in data or "url" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    asset = create_asset(current_app.db, {
        "title": data["title"],
        "url": data["url"],
        "tag": data.get("tag", "asset"),
    })

    asset["id"] = str(asset["_id"])
    del asset["_id"]

    return jsonify(asset), 201


@bp.route("/admin/assets", methods=["GET"])
def list_assets():
    db = current_app.db
    assets = db.assets.find().sort("createdAt", -1)

    return jsonify([
        {
            "id": str(a["_id"]),
            "url": a["url"],
            "tag": a.get("tag"),
            "createdAt": a["createdAt"],
        }
        for a in assets
    ])