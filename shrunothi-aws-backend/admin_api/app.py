import logging
from flask import Flask, jsonify
from flask_cors import CORS

from db.client import get_db
from admin_api.routes.genres import bp as genre_bp
from admin_api.routes.admin_emails import bp as admin_emails_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register blueprints
    app.register_blueprint(genre_bp)

    @app.route("/health", methods=["GET"])
    def health():
        try:
            db = get_db()
            return jsonify({"status": "ok"}), 200
        except Exception:
            logging.getLogger(__name__).exception("Health check: DB ping failed")
            return jsonify({"status": "error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(port=5001, debug=True)
