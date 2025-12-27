from flask import Blueprint, jsonify, request
from db.client import get_db
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from datetime import datetime

bp = Blueprint("admin_emails", __name__)

# --------------------
# GET all admin emails
# --------------------
@bp.route("/admin/admin-emails", methods=["GET"])
def list_admin_emails():
    db = get_db()

    docs = db.admin_emails.find().sort("created_at", 1)

    return jsonify([
        {
            "id": str(d["_id"]),
            "email": d["email"]
        }
        for d in docs
    ]), 200


# --------------------
# ADD new admin email
# --------------------
@bp.route("/admin/admin-emails", methods=["POST", "OPTIONS"])
def add_admin_email():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({ "error": "Email required" }), 400

    db = get_db()

    try:
        db.admin_emails.insert_one({
            "email": email,
            "created_at": datetime.utcnow()
        })
    except DuplicateKeyError:
        return jsonify({ "error": "Email already admin" }), 409

    return jsonify({ "email": email }), 201

@bp.route("/admin/admin-emails/<email_id>", methods=["DELETE", "OPTIONS"])
def delete_admin_email(email_id):
    if request.method == "OPTIONS":
        return "", 200

    db = get_db()

    result = db.admin_emails.delete_one({ "_id": ObjectId(email_id) })

    if result.deleted_count == 0:
        return jsonify({ "error": "Admin email not found" }), 404

    return jsonify({ "status": "deleted" }), 200