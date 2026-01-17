from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime

bp = Blueprint("admin_announcements", __name__)

# -------------------------
# Serializer (MANDATORY)
# -------------------------
def serialize_announcement(a):
    return {
        "id": str(a["_id"]),
        "title": a["title"],
        "imageUrl": a["image_url"],
        "isActive": a["is_active"],
        "startAt": a.get("start_at"),
        "endAt": a.get("end_at"),
    }


# -------------------------
# GET announcements
# -------------------------
@bp.route("/admin/announcements", methods=["GET"])
def list_announcements():
    docs = current_app.db.announcements.find().sort("created_at", -1)
    return jsonify([serialize_announcement(d) for d in docs])


# -------------------------
# POST announcement
# -------------------------
@bp.route("/admin/announcements", methods=["POST"])
def create_announcement():
    data = request.json

    if not data:
        return jsonify({"error": "Missing payload"}), 400

    doc = {
        "title": data.get("title"),
        "image_url": data.get("imageUrl"),
        "is_active": data.get("isActive", True),
        "start_at": data.get("startAt"),
        "end_at": data.get("endAt"),
        "created_at": datetime.utcnow(),
    }

    result = current_app.db.announcements.insert_one(doc)
    doc["_id"] = result.inserted_id

    return jsonify(serialize_announcement(doc)), 201


# -------------------------
# DELETE announcement
# -------------------------
@bp.route("/admin/announcements/<id>", methods=["DELETE"])
def delete_announcement(id):
    current_app.db.announcements.delete_one({"_id": ObjectId(id)})
    return jsonify({"success": True})