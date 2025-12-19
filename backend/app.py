from flask import Flask, jsonify
from flask_cors import CORS

from db.client import get_db

# Admin routes
from admin_api.routes.genres import bp as admin_genres

# Public routes
from public_api.routes.genres import bp as public_genres
from admin_api.routes.podcasts import bp as admin_podcasts
from public_api.routes.podcasts import bp as public_podcasts


def create_app():
    app = Flask(__name__)
    CORS(app)

    # ---- Register blueprints ----
    app.register_blueprint(admin_genres)   # /admin/genres
    app.register_blueprint(public_genres)  # /genres
    app.register_blueprint(admin_podcasts)
    app.register_blueprint(public_podcasts)


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
