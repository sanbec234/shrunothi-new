from flask import Blueprint, jsonify
from db.client import get_db
from bson import ObjectId
from db.models.subscriber import is_subscriber
from auth.auth_guard import attach_optional_user
from extensions import limiter
import re

bp = Blueprint("public_genre_material", __name__)


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&quot;", '"', text)
    return text.strip()


def _resolve_content(doc):
    if doc.get("source") == "google_docs":
        return doc.get("html_content", "")
    return doc.get("content", "")


@bp.route("/genres/<genre_id>/material", methods=["GET"])
@limiter.limit("500 per minute")
def genre_material(genre_id):
    db = get_db()
    user = attach_optional_user()
    caller_is_subscriber = is_subscriber(db, user["email"]) if user else False

    docs = db.materials.find({ "genreId": genre_id })

    materials = []
    for d in docs:
        subscriber_only = bool(d.get("subscriberOnly", False))
        locked = subscriber_only and not caller_is_subscriber
        materials.append({
            "id": str(d["_id"]),
            "title": d["title"],
            "author": d.get("author", "Unknown"),
            "thumbnailUrl": d.get("thumbnailUrl"),
            "subscriberOnly": subscriber_only,
            "locked": locked,
            "preview": "" if locked else _strip_html(_resolve_content(d))[:300],
        })

    return jsonify(materials), 200
