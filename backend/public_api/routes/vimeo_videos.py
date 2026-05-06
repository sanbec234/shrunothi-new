from flask import Blueprint, jsonify
from db.client import get_db
from db.models.vimeo_video import serialize_vimeo_video
from db.models.subscriber import is_subscriber
from auth.auth_guard import attach_optional_user
from extensions import limiter

bp = Blueprint("public_vimeo_videos", __name__)


@bp.route("/vimeo-videos", methods=["GET"])
@limiter.limit("500 per minute")
def list_vimeo_videos():
    db = get_db()
    user = attach_optional_user()
    caller_is_subscriber = is_subscriber(db, user["email"]) if user else False

    docs = list(db.vimeo_videos.find().sort("created_at", -1))

    result = []
    for doc in docs:
        item = serialize_vimeo_video(doc)
        item["locked"] = not caller_is_subscriber
        result.append(item)

    return jsonify(result), 200
