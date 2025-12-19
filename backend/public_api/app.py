from flask import Flask
from flask_cors import CORS
from public_api.routes.genres import bp as genres_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(genres_bp)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(port=5002, debug=True)
