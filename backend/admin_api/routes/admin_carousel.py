from flask import Blueprint, request, jsonify
from db.client import get_db
from bson import ObjectId
from datetime import datetime
from auth.auth_guard import require_admin
import boto3
import os

bp = Blueprint("admin_carousel", __name__)

AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
BUCKET = os.environ.get("AWS_BUCKET_NAME")

s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
)


@bp.route("/admin/carousel", methods=["GET"])
@require_admin
def list_carousel_banners():
    db = get_db()
    docs = list(db.carousel_banners.find().sort("order", 1))
    return jsonify([
        {
            "id": str(doc["_id"]),
            "image_url": doc.get("image_url", ""),
            "s3_key": doc.get("s3_key", ""),
            "order": doc.get("order", 0),
            "active": doc.get("active", True),
            "created_at": doc.get("created_at", ""),
        }
        for doc in docs
    ]), 200


@bp.route("/admin/carousel", methods=["POST"])
@require_admin
def create_carousel_banner():
    data = request.get_json() or {}

    image_url = data.get("image_url")
    s3_key = data.get("s3_key")

    if not image_url or not s3_key:
        return jsonify({"error": "image_url and s3_key are required"}), 400

    db = get_db()

    # Auto-set order to max + 1
    last = db.carousel_banners.find_one(sort=[("order", -1)])
    next_order = (last["order"] + 1) if last and "order" in last else 0

    doc = {
        "image_url": image_url,
        "s3_key": s3_key,
        "order": next_order,
        "active": True,
        "created_at": datetime.utcnow(),
    }

    result = db.carousel_banners.insert_one(doc)

    return jsonify({
        "id": str(result.inserted_id),
        "image_url": image_url,
        "s3_key": s3_key,
        "order": next_order,
        "active": True,
    }), 201


@bp.route("/admin/carousel/<banner_id>", methods=["PUT"])
@require_admin
def update_carousel_banner(banner_id):
    try:
        oid = ObjectId(banner_id)
    except Exception:
        return jsonify({"error": "Invalid banner id"}), 400

    data = request.get_json() or {}
    update_fields = {}

    if "order" in data:
        update_fields["order"] = int(data["order"])
    if "active" in data:
        update_fields["active"] = bool(data["active"])

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    db = get_db()
    result = db.carousel_banners.update_one({"_id": oid}, {"$set": update_fields})

    if result.matched_count == 0:
        return jsonify({"error": "Banner not found"}), 404

    return jsonify({"status": "updated"}), 200


@bp.route("/admin/carousel/<banner_id>", methods=["DELETE", "OPTIONS"])
@require_admin
def delete_carousel_banner(banner_id):
    if request.method == "OPTIONS":
        return "", 200

    try:
        oid = ObjectId(banner_id)
    except Exception:
        return jsonify({"error": "Invalid banner id"}), 400

    db = get_db()
    doc = db.carousel_banners.find_one({"_id": oid})

    if not doc:
        return jsonify({"error": "Banner not found"}), 404

    # Delete from S3 (best-effort)
    s3_key = doc.get("s3_key")
    if s3_key and BUCKET:
        try:
            s3.delete_object(Bucket=BUCKET, Key=s3_key)
        except Exception:
            pass  # Don't fail if S3 delete fails

    db.carousel_banners.delete_one({"_id": oid})

    return jsonify({"status": "deleted"}), 200
