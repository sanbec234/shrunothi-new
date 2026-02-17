from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime
from auth.auth_guard import require_admin

bp = Blueprint("admin_editor_images", __name__)


def serialize_editor_image(img):
    """Convert MongoDB document to JSON-safe dict"""
    return {
        "id": str(img["_id"]),
        "imageUrl": img["imageUrl"],
        "filename": img.get("filename", ""),
        "contentType": img.get("contentType", ""),
        "uploadedAt": img.get("uploadedAt")
    }


@bp.route("/admin/editor/images", methods=["GET"])
@require_admin
def list_editor_images():
    """Get all uploaded editor images"""
    docs = current_app.db.editor_images.find().sort("uploadedAt", -1)
    return jsonify([serialize_editor_image(d) for d in docs])


@bp.route("/admin/editor/images", methods=["POST"])
@require_admin
def save_editor_image():
    """Save editor image metadata after S3 upload"""
    data = request.json

    if not data or not data.get("imageUrl"):
        return jsonify({"error": "imageUrl required"}), 400

    doc = {
        "imageUrl": data["imageUrl"],
        "filename": data.get("filename", ""),
        "contentType": data.get("contentType", ""),
        "uploadedAt": datetime.utcnow(),
    }

    result = current_app.db.editor_images.insert_one(doc)
    doc["_id"] = result.inserted_id

    return jsonify(serialize_editor_image(doc)), 201


@bp.route("/admin/editor/images/<id>", methods=["DELETE"])
@require_admin
def delete_editor_image(id):
    """Delete editor image record"""
    try:
        current_app.db.editor_images.delete_one({"_id": ObjectId(id)})
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500