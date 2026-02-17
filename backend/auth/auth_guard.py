from functools import wraps
from flask import request, jsonify
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from db.client import get_db
import os

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# def require_admin(f):
#     @wraps(f)
#     def decorated(*args, **kwargs):
#         auth_header = request.headers.get("Authorization")

#         if not auth_header or not auth_header.startswith("Bearer "):
#             return jsonify({ "error": "Unauthorized" }), 401

#         token = auth_header.split(" ")[1]

#         try:
#             payload = id_token.verify_oauth2_token(
#                 token,
#                 google_requests.Request(),
#                 GOOGLE_CLIENT_ID
#             )

#             email = payload.get("email", "").lower().strip()
#             if not email:
#                 return jsonify({ "error": "Unauthorized" }), 401

#             db = get_db()
#             is_admin = db.admin_emails.find_one({ "email": email })

#             if not is_admin:
#                 return jsonify({ "error": "Forbidden" }), 403

#             # Attach trusted user info if needed
#             request.user = {
#                 "email": email,
#                 "sub": payload.get("sub"),
#             }

#             return f(*args, **kwargs)

#         except Exception:
#             return jsonify({ "error": "Invalid or expired token" }), 401

#     return decorated

def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        # ✅ ALLOW CORS PREFLIGHT — DO NOT AUTH OPTIONS
        if request.method == "OPTIONS":
            return "", 200

        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({ "error": "Unauthorized" }), 401

        token = auth_header.split(" ")[1]

        try:
            payload = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                GOOGLE_CLIENT_ID
            )

            email = payload.get("email", "").lower().strip()
            if not email:
                return jsonify({ "error": "Unauthorized" }), 401

            db = get_db()
            is_admin = db.admin_emails.find_one({ "email": email })

            if not is_admin:
                return jsonify({ "error": "Forbidden" }), 403

            request.user = {
                "email": email,
                "sub": payload.get("sub"),
            }

            return f(*args, **kwargs)

        except Exception:
            return jsonify({ "error": "Invalid or expired token" }), 401

    return decorated