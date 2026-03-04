from flask import Blueprint, jsonify, request
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


def normalized_language(doc: dict) -> str:
    return (doc.get("language") or "").strip() or "English"


@bp.route("/genres/<genre_id>/podcasts", methods=["GET"])
@limiter.limit("500 per minute")
def genre_podcasts(genre_id):
    db = get_db()

    language = (request.args.get("language") or "").strip()

    query = {"genreId": genre_id}
    if language and language.lower() != "all languages":
        if language == "English":
            query["$or"] = [
                {"language": "English"},
                {"language": {"$exists": False}},
                {"language": ""},
                {"language": None},
            ]
        else:
            query["language"] = language

    docs = list(db.podcasts.find(query))

    podcasts = []
    for d in docs:
        podcasts.append({
            "title": d["title"],
            "embed_url": to_embed_url(d["spotifyUrl"]),
            "language": normalized_language(d),
        })

    all_docs_for_genre = list(db.podcasts.find({"genreId": genre_id}))
    languages = sorted({normalized_language(d) for d in all_docs_for_genre})

    return jsonify({"podcasts": podcasts, "languages": languages}), 200
