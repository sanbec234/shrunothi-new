from datetime import datetime


def serialize_podcast(d):
    language = (d.get("language") or "").strip() or "English"
    return {
        "id": str(d["_id"]),
        "title": d.get("title", ""),
        "spotifyUrl": d.get("spotifyUrl", ""),
        "genreId": str(d.get("genreId")) if d.get("genreId") else None,
        "language": language,
        "showInWhatsNew": bool(d.get("show_in_whats_new", False)),
    }


def create_podcast(db, data):
    now = datetime.utcnow()
    language = (data.get("language") or "").strip() or "English"
    result = db.podcasts.insert_one({
        "title": data["title"],
        "spotifyUrl": data["spotifyUrl"],
        "genreId": data["genreId"],
        "language": language,
        "show_in_whats_new": bool(data.get("show_in_whats_new", False)),
        "created_at": now,
        "updated_at": now,
    })
    return result.inserted_id
