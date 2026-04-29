from flask import Blueprint, jsonify
from bson import ObjectId
from db.client import get_db
from db.models.subscriber import is_subscriber
from auth.auth_guard import attach_optional_user
from extensions import limiter

bp = Blueprint("public_material", __name__)


def _resolve_content(doc):
    if doc.get("source") == "google_docs":
        return doc.get("html_content", "")
    return doc.get("content", "")


@bp.route("/material/<material_id>", methods=["GET"])
@limiter.limit("500 per minute")
def get_material(material_id):
    db = get_db()

    try:
        oid = ObjectId(material_id)
    except Exception:
        return jsonify({ "error": "Invalid id" }), 400

    user = attach_optional_user()
    caller_is_subscriber = is_subscriber(db, user["email"]) if user else False

    doc = db.materials.find_one({ "_id": oid })
    if doc:
        subscriber_only = bool(doc.get("subscriberOnly", False))
        if subscriber_only and not caller_is_subscriber:
            return jsonify({ "error": "Subscription required" }), 403
        return jsonify({
            "id": material_id,
            "title": doc.get("title"),
            "author": doc.get("author"),
            "genreId": str(doc.get("genreId")) if doc.get("genreId") else None,
            "content": _resolve_content(doc),
            "subscriberOnly": subscriber_only,
        }), 200

    doc = db.self_help.find_one({ "_id": oid })
    if doc:
        subscriber_only = bool(doc.get("subscriberOnly", False))
        if subscriber_only and not caller_is_subscriber:
            return jsonify({ "error": "Subscription required" }), 403
        return jsonify({
            "id": material_id,
            "title": doc.get("title"),
            "author": doc.get("author"),
            "content": _resolve_content(doc),
            "subscriberOnly": subscriber_only,
        }), 200

    return jsonify({ "error": "File not found" }), 404
