from flask import Flask
from flask_cors import CORS

from public_api.routes.genres import bp as genres_bp
from public_api.routes.genre_podcasts import bp as genre_podcasts_bp
from public_api.routes.genre_material import bp as genre_material_bp
from public_api.routes.material import bp as material_bp
from public_api.routes.corpus_self_help import bp as corpus_self_help_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(genres_bp)
    app.register_blueprint(genre_podcasts_bp)
    app.register_blueprint(genre_material_bp)
    app.register_blueprint(material_bp)
    app.register_blueprint(corpus_self_help_bp)
    
    @app.route("/health")
    def health():
        return { "status": "ok" }

    return app

app = create_app()

if __name__ == "__main__":
    app.run(port=5002, debug=True)

