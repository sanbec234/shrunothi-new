from flask import Blueprint, jsonify, request
from db.client import get_db
from extensions import limiter

bp = Blueprint("public_genre_podcasts", __name__)
SUPPORTED_LANGUAGES = ("English", "Hindi", "Tamil")

def to_embed_url(spotify_url: str) -> str:
    """
    Converts:
    https://open.spotify.com/show/XYZ
    → https://open.spotify.com/embed/show/XYZ
    """
    if "/embed/" in spotify_url:
        return spotify_url
    return spotify_url.replace("open.spotify.com/", "open.spotify.com/embed/")


def normalized_language(doc: dict) -> str:
    language = (doc.get("language") or "").strip() or "English"
    return language if language in SUPPORTED_LANGUAGES else "English"


@bp.route("/genres/<genre_id>/podcasts", methods=["GET"])
@limiter.limit("500 per minute")
def genre_podcasts(genre_id):
    db = get_db()

    language = (request.args.get("language") or "").strip()
    selected_language = language if language in SUPPORTED_LANGUAGES else "English"

    docs = list(db.podcasts.find({"genreId": genre_id}))

    podcasts = []
    for d in docs:
        doc_language = normalized_language(d)
        if doc_language != selected_language:
            continue

        podcasts.append({
            "title": d["title"],
            "embed_url": to_embed_url(d["spotifyUrl"]),
            "language": doc_language,
        })

    available = {normalized_language(d) for d in docs}
    languages = [lang for lang in SUPPORTED_LANGUAGES if lang in available]

    return jsonify({"podcasts": podcasts, "languages": languages}), 200
