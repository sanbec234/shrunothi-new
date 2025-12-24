from flask import Flask, jsonify
from flask_cors import CORS

from db.client import get_db

# Admin routes
from admin_api.routes.genres import bp as admin_genres

# Public routes
from public_api.routes.genres import bp as public_genres
from admin_api.routes.podcasts import bp as admin_podcasts
from public_api.routes.podcasts import bp as public_podcasts
from admin_api.routes.materials import bp as admin_materials
from public_api.routes.materials import bp as public_materials
from admin_api.routes.self_help import bp as admin_self_help
from public_api.routes.self_help import bp as public_self_help
from public_api.routes.genre_podcasts import bp as genre_podcasts_bp
from public_api.routes.material import bp as public_material

#Login route
from auth.routes import auth_bp

def create_app():
    app = Flask(__name__)
    CORS(
        app,
        supports_credentials=True,
        resources={r"/*": {"origins": "http://localhost:5173"}}
    )


    # ---- Register blueprints ----
    app.register_blueprint(admin_genres)   # /admin/genres
    app.register_blueprint(public_genres)  # /genres
    app.register_blueprint(admin_podcasts)
    app.register_blueprint(public_podcasts)
    app.register_blueprint(admin_materials)
    app.register_blueprint(public_materials)
    app.register_blueprint(admin_self_help)
    app.register_blueprint(public_self_help)
    app.register_blueprint(genre_podcasts_bp)
    app.register_blueprint(public_material)
    app.register_blueprint(auth_bp)  # /auth

    # ---- Health check ----
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
    app.run(port=5001, debug=True)
