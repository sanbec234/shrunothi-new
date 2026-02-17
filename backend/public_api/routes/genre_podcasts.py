from flask import Blueprint, jsonify
from db.client import get_db
from extensions import limiter

bp = Blueprint("public_genre_podcasts", __name__)

def to_embed_url(spotify_url: str) -> str:
    """
    Converts:
    https://open.spotify.com/show/XYZ
    → https://open.spotify.com/embed/show/XYZ
    """
    if "/embed/" in spotify_url:
        return spotify_url
    return spotify_url.replace("open.spotify.com/", "open.spotify.com/embed/")

@bp.route("/genres/<genre_id>/podcasts", methods=["GET"])
@limiter.limit("500 per minute")
def genre_podcasts(genre_id):
    db = get_db()

    docs = db.podcasts.find({ "genreId": genre_id })

    podcasts = []
    for d in docs:
        podcasts.append({
            "title": d["title"],
            "embed_url": to_embed_url(d["spotifyUrl"])
        })

    return jsonify({ "podcasts": podcasts }), 200
