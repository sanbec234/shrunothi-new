import re
import requests
from typing import Optional
from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from db.client import get_db
from db.models.vimeo_video import create_vimeo_video, serialize_vimeo_video
from auth.auth_guard import require_admin
from utils.audit import audit_log

bp = Blueprint("admin_vimeo", __name__)


def _extract_vimeo_id(url: str) -> Optional[str]:
    """Extract numeric Vimeo video ID from any Vimeo URL."""
    match = re.search(r"vimeo\.com/(?:video/)?(\d+)", url)
    return match.group(1) if match else None


def _fetch_vimeo_thumbnail(vimeo_id: str) -> Optional[str]:
    """Fetch thumbnail from Vimeo oEmbed API (no API key needed for embeddable videos)."""
    try:
        resp = requests.get(
            "https://vimeo.com/api/oembed.json",
            params={"url": f"https://vimeo.com/{vimeo_id}"},
            timeout=8,
        )
        if resp.status_code == 200:
            return resp.json().get("thumbnail_url")
    except Exception:
        pass
    return None


# -------------------------------
# LIST ALL VIMEO VIDEOS
# GET /admin/vimeo-videos
# -------------------------------
@bp.route("/admin/vimeo-videos", methods=["GET"])
@require_admin
def list_vimeo_videos():
    db = get_db()
    docs = list(db.vimeo_videos.find().sort("created_at", -1))
    return jsonify([serialize_vimeo_video(d) for d in docs]), 200


# -------------------------------
# ADD VIMEO VIDEO
# POST /admin/vimeo-videos
# -------------------------------
@bp.route("/admin/vimeo-videos", methods=["POST"])
@require_admin
@audit_log("vimeo_video.create")
def add_vimeo_video():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    vimeo_url = (data.get("vimeo_url") or "").strip()

    if not title:
        return jsonify({"error": "title is required"}), 400
    if not vimeo_url:
        return jsonify({"error": "vimeo_url is required"}), 400

    vimeo_id = _extract_vimeo_id(vimeo_url)
    if not vimeo_id:
        return jsonify({"error": "Could not extract Vimeo video ID from URL"}), 400

    thumbnail_url = _fetch_vimeo_thumbnail(vimeo_id)

    db = get_db()
    inserted_id = create_vimeo_video(db, {
        "title": title,
        "vimeo_id": vimeo_id,
        "thumbnail_url": thumbnail_url,
    })

    return jsonify({
        "id": str(inserted_id),
        "title": title,
        "vimeo_id": vimeo_id,
        "thumbnail_url": thumbnail_url,
    }), 201


# -------------------------------
# UPDATE VIMEO VIDEO
# PUT /admin/vimeo-videos/<id>
# -------------------------------
@bp.route("/admin/vimeo-videos/<video_id>", methods=["PUT"])
@require_admin
@audit_log("vimeo_video.update")
def update_vimeo_video(video_id):
    try:
        oid = ObjectId(video_id)
    except Exception:
        return jsonify({"error": "Invalid video id"}), 400

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    vimeo_url = (data.get("vimeo_url") or "").strip()

    if not title:
        return jsonify({"error": "title is required"}), 400

    update_fields = {"title": title, "updated_at": datetime.utcnow()}

    if vimeo_url:
        vimeo_id = _extract_vimeo_id(vimeo_url)
        if not vimeo_id:
            return jsonify({"error": "Could not extract Vimeo video ID from URL"}), 400
        thumbnail_url = _fetch_vimeo_thumbnail(vimeo_id)
        update_fields["vimeo_id"] = vimeo_id
        update_fields["thumbnail_url"] = thumbnail_url

    db = get_db()
    result = db.vimeo_videos.update_one({"_id": oid}, {"$set": update_fields})

    if result.matched_count == 0:
        return jsonify({"error": "Video not found"}), 404

    return jsonify({"status": "updated"}), 200


# -------------------------------
# DELETE VIMEO VIDEO
# DELETE /admin/vimeo-videos/<id>
# -------------------------------
@bp.route("/admin/vimeo-videos/<video_id>", methods=["DELETE", "OPTIONS"])
@require_admin
@audit_log("vimeo_video.delete")
def delete_vimeo_video(video_id):
    if request.method == "OPTIONS":
        return "", 200

    try:
        oid = ObjectId(video_id)
    except Exception:
        return jsonify({"error": "Invalid video id"}), 400

    db = get_db()
    result = db.vimeo_videos.delete_one({"_id": oid})

    if result.deleted_count == 0:
        return jsonify({"error": "Video not found"}), 404

    return jsonify({"status": "deleted"}), 200
