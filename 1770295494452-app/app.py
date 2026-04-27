from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

print("📁 BASE_DIR =", BASE_DIR)
print("📄 ENV_PATH =", ENV_PATH)
print("📄 ENV EXISTS =", ENV_PATH.exists())

load_dotenv(dotenv_path=ENV_PATH, override=True)

print("AWS_BUCKET_NAME =", os.getenv("AWS_BUCKET_NAME"))

from flask import Flask, jsonify
from flask_cors import CORS   
from extensions import limiter
from db.client import get_db
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

# ---------- Public routes ----------
from public_api.routes.genres import bp as public_genres
from public_api.routes.podcasts import bp as public_podcasts
from public_api.routes.materials import bp as public_materials
from public_api.routes.material import bp as public_material
from public_api.routes.genre_podcasts import bp as genre_podcasts_bp
from public_api.routes.self_help import bp as public_self_help
from public_api.routes.corpus_self_help import bp as corpus_self_help_bp
from public_api.routes.announcements import bp as announcements_bp  # NEW

# ---------- Auth ----------
from auth.routes import auth_bp

def create_app():
    app = Flask(__name__)

    # Init limiter
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

    # ---------- Register public APIs ----------
    app.register_blueprint(public_genres)
    app.register_blueprint(public_podcasts)
    app.register_blueprint(public_materials)
    app.register_blueprint(public_material)
    app.register_blueprint(genre_podcasts_bp)
    app.register_blueprint(public_self_help)
    app.register_blueprint(corpus_self_help_bp)
    app.register_blueprint(announcements_bp)

    # ---------- Auth ----------
    app.register_blueprint(auth_bp)

    # ---------- Health check ----------
    @app.route("/health", methods=["GET"])
    def health():
        try:
            get_db().command("ping")
            return jsonify({"status": "ok"}), 200
        except Exception as e:
            return jsonify({"status": "error", "error": str(e)}), 500

    print("\n=== REGISTERED ROUTES ===")
    for rule in app.url_map.iter_rules():
        print(rule, rule.methods)

    return app

application = create_app()

if __name__ == "__main__":
    application.run(host="0.0.0.0", port=5001, debug=True)
