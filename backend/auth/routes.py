from flask import Blueprint, request, jsonify
from google.oauth2 import id_token
from google.auth.transport import requests
import os

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")  # optional but clean

@auth_bp.route("/google", methods=["POST"])
def google_auth():
    data = request.get_json()
    token = data.get("token")

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        name = idinfo.get("name")

        role = "admin" if email == ADMIN_EMAIL else "user"

        return jsonify({
            "name": name,
            "email": email,
            "role": role
        })

    except Exception:
        return jsonify({"error": "Invalid Google token"}), 401