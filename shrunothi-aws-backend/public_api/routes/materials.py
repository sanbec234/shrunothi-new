from flask import Blueprint, jsonify
from db.client import get_db
from db.models.material import serialize_material
from db.models.subscriber import is_subscriber
from auth.auth_guard import attach_optional_user
from bson import ObjectId
from extensions import limiter
import re

bp = Blueprint("public_materials", __name__)


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


def _serialize_for_caller(doc, caller_is_subscriber):
    """List-view payload with a short preview when the item is accessible."""
    out = serialize_material(doc)
    locked = bool(out.get("subscriberOnly")) and not caller_is_subscriber
    out["locked"] = locked
    out["thumbnailUrl"] = doc.get("thumbnailUrl")
    out["preview"] = "" if locked else _strip_html(_resolve_content(doc))[:300]
    return out


@bp.route("/materials", methods=["GET"])
@limiter.limit("500 per minute")
def list_materials():
    db = get_db()
    user = attach_optional_user()
    caller_is_subscriber = is_subscriber(db, user["email"]) if user else False
    docs = db.materials.find()
    return jsonify([_serialize_for_caller(d, caller_is_subscriber) for d in docs]), 200


@bp.route("/genres/<genre_id>/material", methods=["GET"])
@limiter.limit("500 per minute")
def get_materials_by_genre(genre_id):
    db = get_db()
    user = attach_optional_user()
    caller_is_subscriber = is_subscriber(db, user["email"]) if user else False

    docs = db.materials.find({
        "$or": [
            { "genreId": genre_id },
            { "genreId": ObjectId(genre_id) }
        ]
    })

    return jsonify([_serialize_for_caller(d, caller_is_subscriber) for d in docs]), 200
