from flask import Flask, jsonify
from flask_cors import CORS

from db.client import get_db

# ---------- Admin routes ----------
from admin_api.routes.genres import bp as admin_genres
from admin_api.routes.podcasts import bp as admin_podcasts
from admin_api.routes.materials import bp as admin_materials
from admin_api.routes.self_help import bp as admin_self_help
from admin_api.routes.admin_emails import bp as admin_emails_bp
from admin_api.routes.users import bp as admin_users

# ---------- Public routes ----------
from public_api.routes.genres import bp as public_genres
from public_api.routes.podcasts import bp as public_podcasts
from public_api.routes.materials import bp as public_materials
from public_api.routes.material import bp as public_material
from public_api.routes.genre_podcasts import bp as genre_podcasts_bp
from public_api.routes.self_help import bp as public_self_help
from public_api.routes.corpus_self_help import bp as corpus_self_help_bp

# ---------- Auth ----------
from auth.routes import auth_bp


def create_app():
    app = Flask(__name__)

    # CORS — open for now (lock to domain after deploy)
    CORS(
        app,
        supports_credentials=True,
        resources={r"/*": {"origins": "*"}}
    )

    # ---------- Register admin APIs ----------
    app.register_blueprint(admin_genres)        # /admin/genres
    app.register_blueprint(admin_podcasts)      # /admin/podcasts
    app.register_blueprint(admin_materials)     # /admin/materials
    app.register_blueprint(admin_self_help)     # /admin/self-help
    app.register_blueprint(admin_emails_bp)     # /admin/admin-emails
    app.register_blueprint(admin_users)         # /admin/users

    # ---------- Register public APIs ----------
    app.register_blueprint(public_genres)       # /genres
    app.register_blueprint(public_podcasts)     # /podcasts
    app.register_blueprint(public_materials)    # /materials
    app.register_blueprint(public_material)     # /material/<id>
    app.register_blueprint(genre_podcasts_bp)   # /genres/<id>/podcasts
    app.register_blueprint(public_self_help)    # /self-help
    app.register_blueprint(corpus_self_help_bp) # /corpus/self-help

    # ---------- Auth ----------
    app.register_blueprint(auth_bp)              # /auth/google

    # ---------- Health check ----------
    @app.route("/health", methods=["GET"])
    def health():
        try:
            get_db().command("ping")
            return jsonify({"status": "ok"}), 200
        except Exception as e:
            return jsonify({"status": "error", "error": str(e)}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)