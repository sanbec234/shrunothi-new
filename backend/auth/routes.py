from flask import Blueprint, request, jsonify
from google.oauth2 import id_token
from google.auth.transport import requests
from db.client import get_db
from db.models.subscriber import is_subscriber
from auth.auth_guard import attach_optional_user
import os
from datetime import datetime
from extensions import limiter
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@auth_bp.route("/google", methods=["POST"])
@limiter.limit("500 per minute")
def google_auth():
    data = request.get_json() or {}
    token = data.get("token")

    if not token:
        return jsonify({ "error": "Token required" }), 400

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo["email"].lower().strip()
        name = idinfo.get("name", "")

        db = get_db()

        # 🔐 Check admin privilege
        is_admin = db.admin_emails.find_one({ "email": email }) is not None
        role = "admin" if is_admin else "user"

        # 🧾 Upsert user record
        db.users.update_one(
            { "email": email },
            {
                "$set": {
                    "name": name,
                    "email": email,
                    "role": role,
                    "last_login": datetime.utcnow()
                },
                "$setOnInsert": {
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        return jsonify({
            "name": name,
            "email": email,
            "role": role
        }), 200

    except Exception:
        return jsonify({ "error": "Invalid Google token" }), 401


@auth_bp.route("/me/subscription", methods=["GET"])
@limiter.limit("500 per minute")
def my_subscription():
    """
    Returns { isSubscribed: bool } for the bearer of the token.
    Anonymous callers get { isSubscribed: false } with 200 — this is a
    UI hint, not an auth gate, so a missing token isn't an error.
    """
    user = attach_optional_user()
    if not user:
        return jsonify({"isSubscribed": False}), 200
    db = get_db()
    return jsonify({"isSubscribed": bool(is_subscriber(db, user["email"]))}), 200