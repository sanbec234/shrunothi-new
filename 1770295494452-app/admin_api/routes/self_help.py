from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.self_help import create_self_help
from bson import ObjectId
from datetime import datetime
import json
from auth.auth_guard import require_admin
from googleapiclient.errors import HttpError
from admin_api.services.google_docs import extract_doc_id, fetch_google_doc, convert_to_html

bp = Blueprint("admin_self_help", __name__)

# -------------------------------
# ADD SELF-HELP
# POST /admin/self-help
# -------------------------------
@bp.route("/admin/self-help", methods=["POST"])
@require_admin
def add_self_help():
    data = request.get_json() or {}

    required = ["title", "author", "content"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    db = get_db()
    doc_id = create_self_help(db, data)

    return jsonify({
        "id": str(doc_id),
        "title": data["title"]
    }), 201


# -------------------------------
# UPDATE SELF-HELP
# PUT or PATCH /admin/self-help/<id>
# -------------------------------
@bp.route("/admin/self-help/<self_help_id>", methods=["PUT", "PATCH"])
@require_admin
def update_self_help(self_help_id):
    db = get_db()

    try:
        oid = ObjectId(self_help_id)
    except Exception:
        return jsonify({ "error": "Invalid self-help id" }), 400

    data = request.get_json() or {}

    # Required fields
    for field in ["title", "author", "content"]:
        if not data.get(field):
            return jsonify({ "error": f"{field} is required" }), 400

    result = db.self_help.update_one(
        { "_id": oid },
        { "$set": {
            "title": data["title"],
            "author": data["author"],
            "content": data["content"],
            "updated_at": datetime.utcnow()
        }}
    )

    if result.matched_count == 0:
        return jsonify({ "error": "Self-help not found" }), 404

    return jsonify({ "status": "updated" }), 200


# -------------------------------
# DELETE SELF-HELP
# DELETE /admin/self-help/<id>
# -------------------------------
@bp.route("/admin/self-help/<self_help_id>", methods=["DELETE", "OPTIONS"])
@require_admin
def delete_self_help(self_help_id):
    if request.method == "OPTIONS":
        return "", 200

    db = get_db()

    try:
        oid = ObjectId(self_help_id)
    except Exception:
        return jsonify({ "error": "Invalid self-help id" }), 400

    result = db.self_help.delete_one({ "_id": oid })

    if result.deleted_count == 0:
        return jsonify({ "error": "Self-help not found" }), 404

    return jsonify({ "status": "deleted" }), 200


# -------------------------------
# SYNC GOOGLE DOC SELF-HELP
# POST /admin/self-help/sync-google-doc
# -------------------------------
@bp.route("/admin/self-help/sync-google-doc", methods=["POST"])
@require_admin
def sync_google_doc_self_help():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    author = (data.get("author") or "").strip()
    google_doc_url = (data.get("google_doc_url") or "").strip()

    if not title:
        return jsonify({"error": "title is required"}), 400
    if not author:
        return jsonify({"error": "author is required"}), 400
    if not google_doc_url:
        return jsonify({"error": "google_doc_url is required"}), 400

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

    db = get_db()
    now = datetime.utcnow()
    result = db.self_help.insert_one({
        "title": title,
        "author": author,
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
