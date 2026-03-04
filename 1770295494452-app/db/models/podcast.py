from datetime import datetime


def serialize_podcast(d):
    language = (d.get("language") or "").strip() or "English"
    return {
        "id": str(d["_id"]),
        "title": d.get("title", ""),
        # "author": d.get("author", ""),
        "spotifyUrl": d.get("spotifyUrl", ""), 
        "genreId": str(d.get("genreId")) if d.get("genreId") else None,
        "language": language,
    }


def create_podcast(db, data):
    now = datetime.utcnow()
    language = (data.get("language") or "").strip() or "English"
    result = db.podcasts.insert_one({
        "title": data["title"],
        # "author": data["author"],
        "spotifyUrl": data["spotifyUrl"],
        "genreId": data["genreId"],
        "language": language,
        "created_at": now,
        "updated_at": now
    })
    return result.inserted_id
