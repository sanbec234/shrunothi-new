from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.material import create_material
from bson import ObjectId
from datetime import datetime
import json
from auth.auth_guard import require_admin
from googleapiclient.errors import HttpError
from admin_api.services.google_docs import extract_doc_id, fetch_google_doc, convert_to_html

bp = Blueprint("admin_materials", __name__)

# -------------------------------
# ADD MATERIAL
# POST /admin/materials
# -------------------------------
@bp.route("/admin/materials", methods=["POST"])
@require_admin
def add_material():
    data = request.get_json() or {}

    required = ["title", "author", "content", "genreId"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    db = get_db()
    material_id = create_material(db, data)

    return jsonify({
        "id": str(material_id),
        "title": data["title"]
    }), 201


# -------------------------------
# UPDATE MATERIAL
# PUT or PATCH /admin/materials/<id>
# -------------------------------
@bp.route("/admin/materials/<material_id>", methods=["PUT", "PATCH"])
@require_admin
def update_material(material_id):
    db = get_db()

    try:
        oid = ObjectId(material_id)
    except Exception:
        return jsonify({ "error": "Invalid material id" }), 400

    data = request.get_json() or {}

    # Validate required fields
    for field in ["title", "author", "content", "genreId"]:
        if not data.get(field):
            return jsonify({ "error": f"{field} is required" }), 400

    # Validate genre exists
    try:
        genre_oid = ObjectId(data["genreId"])
    except Exception:
        return jsonify({ "error": "Invalid genreId" }), 400

    if not db.genres.find_one({ "_id": genre_oid }):
        return jsonify({ "error": "Genre not found" }), 400

    result = db.materials.update_one(
        { "_id": oid },
        { "$set": {
            "title": data["title"],
            "author": data["author"],
            "content": data["content"],
            "genreId": data["genreId"],  # keep STRING for consistency
            "updated_at": datetime.utcnow()
        }}
    )

    if result.matched_count == 0:
        return jsonify({ "error": "Material not found" }), 404

    return jsonify({ "status": "updated" }), 200


# -------------------------------
# DELETE MATERIAL
# DELETE /admin/materials/<id>
# -------------------------------
@bp.route("/admin/materials/<material_id>", methods=["DELETE", "OPTIONS"])
@require_admin
def delete_material(material_id):
    if request.method == "OPTIONS":
        return "", 200

    db = get_db()

    try:
        oid = ObjectId(material_id)
    except Exception:
        return jsonify({ "error": "Invalid material id" }), 400

    result = db.materials.delete_one({ "_id": oid })

    if result.deleted_count == 0:
        return jsonify({ "error": "Material not found" }), 404

    return jsonify({ "status": "deleted" }), 200


# -------------------------------
# SYNC GOOGLE DOC MATERIAL
# POST /admin/materials/sync-google-doc
# -------------------------------
@bp.route("/admin/materials/sync-google-doc", methods=["POST"])
@require_admin
def sync_google_doc_material():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    author = (data.get("author") or "").strip()
    google_doc_url = (data.get("google_doc_url") or "").strip()
    genre_id = (data.get("genreId") or "").strip()

    if not title:
        return jsonify({"error": "title is required"}), 400
    if not author:
        return jsonify({"error": "author is required"}), 400
    if not google_doc_url:
        return jsonify({"error": "google_doc_url is required"}), 400
    if not genre_id:
        return jsonify({"error": "genreId is required"}), 400

    db = get_db()
    try:
        genre_oid = ObjectId(genre_id)
    except Exception:
        return jsonify({"error": "Invalid genreId"}), 400

    if not db.genres.find_one({"_id": genre_oid}):
        return jsonify({"error": "Genre not found"}), 400

    try:
        doc_id = extract_doc_id(google_doc_url)
    except ValueError as exc:
        message = str(exc)
        if message == "Missing doc ID":
            return jsonify({"error": "Missing doc ID"}), 400
        return jsonify({"error": "Invalid URL"}), 400

    try:
        document = fetch_google_doc(doc_id)
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 500
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500
    except HttpError as exc:
        status_code = getattr(exc.resp, "status", None)
        details = _extract_http_error_details(exc)
        if status_code in (403, 404):
            return jsonify({
                "error": "Google Docs access error",
                "details": details or "Document not shared with service account or not found",
            }), 403
        return jsonify({
            "error": "Google Docs API failure",
            "details": details or f"HTTP {status_code}"
        }), 502
    except Exception as exc:
        return jsonify({
            "error": "Google Docs API failure",
            "details": f"{type(exc).__name__}: {str(exc)}",
        }), 502

    html_content = convert_to_html(document)
    if not html_content:
        return jsonify({"error": "Empty document"}), 400

    now = datetime.utcnow()
    result = db.materials.insert_one({
        "title": title,
        "author": author,
        "genreId": genre_id,  # keep STRING for consistency with existing collection
        "google_doc_id": doc_id,
        "html_content": html_content,
        "last_synced": now,
        "source": "google_docs",
        "created_at": now,
        "updated_at": now,
    })

    return jsonify({
        "id": str(result.inserted_id),
        "title": title,
        "author": author,
        "genreId": genre_id,
        "google_doc_id": doc_id,
        "last_synced": now.isoformat() + "Z",
        "source": "google_docs",
    }), 201


def _extract_http_error_details(exc):
    try:
        payload = json.loads(getattr(exc, "content", b"{}").decode("utf-8"))
        return (
            payload.get("error", {}).get("message")
            or payload.get("error_description")
            or None
        )
    except Exception:
        return str(exc)
