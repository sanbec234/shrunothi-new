import logging
import os
from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime
from auth.auth_guard import require_admin
from utils.audit import audit_log
import boto3

log = logging.getLogger(__name__)

bp = Blueprint("admin_editor_images", __name__)

AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
BUCKET = os.environ.get("AWS_BUCKET_NAME")

s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
)


def serialize_editor_image(img):
    """Convert MongoDB document to JSON-safe dict"""
    return {
        "id": str(img["_id"]),
        "imageUrl": img["imageUrl"],
        "filename": img.get("filename", ""),
        "contentType": img.get("contentType", ""),
        "uploadedAt": img.get("uploadedAt"),
    }


@bp.route("/admin/editor/images", methods=["GET"])
@require_admin
def list_editor_images():
    """Get all uploaded editor images"""
    docs = current_app.db.editor_images.find().sort("uploadedAt", -1)
    return jsonify([serialize_editor_image(d) for d in docs])


@bp.route("/admin/editor/images", methods=["POST"])
@require_admin
@audit_log("editor_image.create")
def save_editor_image():
    """Save editor image metadata after S3 upload.

    Now also stores `s3_key` so we can clean up the S3 object on delete.
    """
    data = request.json

    if not data or not data.get("imageUrl"):
        return jsonify({"error": "imageUrl required"}), 400

    doc = {
        "imageUrl": data["imageUrl"],
        # s3_key is optional for backward-compat with old records, but new uploads
        # should always send it so cleanup works.
        "s3_key": data.get("s3_key"),
        "filename": data.get("filename", ""),
        "contentType": data.get("contentType", ""),
        "uploadedAt": datetime.utcnow(),
    }

    result = current_app.db.editor_images.insert_one(doc)
    doc["_id"] = result.inserted_id

    return jsonify(serialize_editor_image(doc)), 201


@bp.route("/admin/editor/images/<id>", methods=["DELETE"])
@require_admin
@audit_log("editor_image.delete")
def delete_editor_image(id):
    """Delete editor image record AND the underlying S3 object."""
    try:
        oid = ObjectId(id)
    except Exception:
        return jsonify({"error": "Invalid id"}), 400

    db = current_app.db
    doc = db.editor_images.find_one({"_id": oid})
    if not doc:
        return jsonify({"error": "Image not found"}), 404

    # Delete the S3 object first to prevent orphans. If it fails, abort
    # so the admin can retry — keeps DB and storage in sync.
    s3_key = doc.get("s3_key")
    if s3_key and BUCKET:
        try:
            s3.delete_object(Bucket=BUCKET, Key=s3_key)
        except Exception as e:
            log.exception(
                "S3 delete failed for editor_image id=%s s3_key=%s",
                id, s3_key,
            )
            return jsonify({
                "error": "Failed to delete image from storage. Please retry.",
                "detail": str(e),
            }), 502

    db.editor_images.delete_one({"_id": oid})
    return jsonify({"success": True})
