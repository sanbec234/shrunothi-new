from datetime import datetime

def serialize_podcast(doc):
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "author": doc["author"],
        "spotifyUrl": doc["spotifyUrl"],
        "genreId": doc["genreId"]
    }

def create_podcast(db, data):
    now = datetime.utcnow()
    result = db.podcasts.insert_one({
        "title": data["title"],
        "author": data["author"],
        "spotifyUrl": data["spotifyUrl"],
        "genreId": data["genreId"],
        "created_at": now,
        "updated_at": now
    })
    return result.inserted_id
