from datetime import datetime

def serialize_genre(doc):
    return {
        "id": str(doc["_id"]),
        "name": doc["name"]
    }

def create_genre(db, name: str):
    now = datetime.utcnow()
    result = db.genres.insert_one({
        "name": name,
        "created_at": now,
        "updated_at": now
    })
    return result.inserted_id
