from flask import Blueprint, jsonify, current_app, request
from datetime import datetime
import logging
from extensions import limiter

logger = logging.getLogger(__name__)

bp = Blueprint("announcements", __name__)


def serialize_announcement(a):
    return {
        "id": str(a["_id"]),
        "title": a.get("title", ""),
        "imageUrl": a.get("image_url", ""),
    }


@bp.route("/announcements/active", methods=["GET", "OPTIONS"])
@limiter.limit("500 per minute")
def get_active_announcements():
    if request.method == "OPTIONS":
        return "", 200

    try:
        if not hasattr(current_app, "db"):
            logger.error("Database not available in app context")
            return jsonify({"error": "Service unavailable"}), 503

        now = datetime.utcnow()

        docs = list(current_app.db.announcements.find({"is_active": True}).sort("created_at", -1))

        active_announcements = []
        for doc in docs:
            start_at = doc.get("start_at")
            end_at = doc.get("end_at")

            if not start_at and not end_at:
                active_announcements.append(serialize_announcement(doc))
                continue

            if (not start_at or now >= start_at) and (not end_at or now <= end_at):
                active_announcements.append(serialize_announcement(doc))

        logger.info("Fetched %d active announcements", len(active_announcements))
        return jsonify(active_announcements), 200

    except Exception as e:
        logger.error("Error fetching active announcements: %s", e, exc_info=True)
        return jsonify({"error": "Failed to fetch announcements"}), 500
