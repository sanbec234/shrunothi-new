from flask import Blueprint, jsonify
from bson import ObjectId
from db.client import get_db
from extensions import limiter

bp = Blueprint("public_material", __name__)

@bp.route("/material/<material_id>", methods=["GET"])
@limiter.limit("500 per minute")
def get_material(material_id):
    db = get_db()

    try:
        oid = ObjectId(material_id)
    except Exception:
        return jsonify({ "error": "Invalid id" }), 400

    doc = db.materials.find_one({ "_id": oid })
    if doc:
        resolved_content = (
            doc.get("html_content", "")
            if doc.get("source") == "google_docs"
            else doc.get("content", "")
        )
        return jsonify({
            "id": material_id,
            "title": doc.get("title"),
            "author": doc.get("author"),
            "genreId": str(doc.get("genreId")) if doc.get("genreId") else None,
            "content": resolved_content
        }), 200

    doc = db.self_help.find_one({ "_id": oid })
    if doc:
        resolved_content = (
            doc.get("html_content", "")
            if doc.get("source") == "google_docs"
            else doc.get("content", "")
        )
        return jsonify({
            "id": material_id,
            "title": doc.get("title"),
            "author": doc.get("author"),
            "content": resolved_content
        }), 200

    return jsonify({ "error": "File not found" }), 404
