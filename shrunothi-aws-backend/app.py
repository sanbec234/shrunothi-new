from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=True)

from flask import Flask, jsonify
from flask_cors import CORS
from extensions import limiter
from db.client import get_db
from config.config import get_config
# app.py (VERY TOP of the file)

# ---------- Admin routes ----------
from admin_api.routes.genres import bp as admin_genres
from admin_api.routes.podcasts import bp as admin_podcasts
from admin_api.routes.materials import bp as admin_materials
from admin_api.routes.self_help import bp as admin_self_help
from admin_api.routes.admin_emails import bp as admin_emails_bp
from admin_api.routes.users import bp as admin_users
from admin_api.routes.admin_announcements import bp as admin_announcements_bp
from admin_api.routes.admin_uploads import bp as admin_uploads_bp
from admin_api.routes.admin_editor_uploads import bp as admin_editor_uploads_bp
from admin_api.routes.admin_editor_images import bp as admin_editor_images_bp
from admin_api.routes.admin_thumbnail_uploads import bp as admin_thumbnail_uploads_bp

# ---------- Public routes ----------
from public_api.routes.genres import bp as public_genres
from public_api.routes.podcasts import bp as public_podcasts
from public_api.routes.materials import bp as public_materials
from public_api.routes.material import bp as public_material
from public_api.routes.genre_podcasts import bp as genre_podcasts_bp
from public_api.routes.self_help import bp as public_self_help
from public_api.routes.corpus_self_help import bp as corpus_self_help_bp
from public_api.routes.announcements import bp as announcements_bp
from public_api.routes.payments import bp as payments_bp

# ---------- Auth ----------
from auth.routes import auth_bp


def _ensure_payment_indexes(db):
    """Create indexes for payment and subscriber collections (safe & idempotent)."""
    db.payments.create_index("user_email")
    db.payments.create_index("razorpay_order_id", unique=True)
    # Sparse so legacy subscriber docs without user_email don't collide.
    db.subscribers.create_index("user_email", unique=True, sparse=True)


def _add_security_headers(response):
    """Attach CSP + standard browser-security headers to every response."""
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' https://checkout.razorpay.com https://accounts.google.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "frame-src https://api.razorpay.com https://checkout.razorpay.com "
        "https://accounts.google.com; "
        "connect-src 'self' https://*.razorpay.com https://accounts.google.com;"
    )
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())

    # Init limiter — degrade gracefully if Redis is unavailable
    app.config.setdefault("RATELIMIT_IN_MEMORY_FALLBACK_ENABLED", True)
    app.config.setdefault("RATELIMIT_IN_MEMORY_FALLBACK", "200 per day;50 per hour")
    limiter.init_app(app)

    cors_origins_env = os.getenv("CORS_ORIGINS")
    if cors_origins_env:
        cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    else:
        cors_origins = [
            "https://shrunothi.com",
            "https://www.shrunothi.com",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://localhost:5173",
            "https://127.0.0.1:5173",
        ]

    # CORS — open for now
    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/*": {
                "origins": cors_origins,
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"]
            }
        }
    )

    app.db = get_db()

    # Payment indexes (idempotent — safe to run on every boot)
    _ensure_payment_indexes(app.db)

    # Validate Razorpay credentials at startup — warns in logs if missing
    from config.razorpay_config import validate_razorpay_config
    validate_razorpay_config()

    # Security headers on every response
    app.after_request(_add_security_headers)

    # ---------- Register admin APIs ----------
    app.register_blueprint(admin_genres)
    app.register_blueprint(admin_podcasts)
    app.register_blueprint(admin_materials)
    app.register_blueprint(admin_self_help)
    app.register_blueprint(admin_emails_bp)
    app.register_blueprint(admin_users)
    app.register_blueprint(admin_announcements_bp)
    app.register_blueprint(admin_uploads_bp)
    app.register_blueprint(admin_editor_uploads_bp)
    app.register_blueprint(admin_editor_images_bp)
    app.register_blueprint(admin_thumbnail_uploads_bp)

    # ---------- Register public APIs ----------
    app.register_blueprint(public_genres)
    app.register_blueprint(public_podcasts)
    app.register_blueprint(public_materials)
    app.register_blueprint(public_material)
    app.register_blueprint(genre_podcasts_bp)
    app.register_blueprint(public_self_help)
    app.register_blueprint(corpus_self_help_bp)
    app.register_blueprint(announcements_bp)
    app.register_blueprint(payments_bp, url_prefix="/payments")

    # ---------- Auth ----------
    app.register_blueprint(auth_bp)

    # ---------- Health check (exempt from rate limiting) ----------
    @app.route("/health", methods=["GET"])
    @limiter.exempt
    def health():
        try:
            get_db().command("ping")
            return jsonify({"status": "ok"}), 200
        except Exception as e:
            return jsonify({"status": "error", "error": str(e)}), 500

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="0.0.0.0", port=5001, debug=True)
