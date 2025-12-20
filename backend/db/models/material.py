from datetime import datetime

def serialize_material(doc):
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "author": doc["author"],
        "genreId": doc["genreId"]
    }

def create_material(db, data):
    now = datetime.utcnow()
    result = db.materials.insert_one({
        "title": data["title"],
        "author": data["author"],
        "content": data["content"],
        "genreId": data["genreId"],
        "created_at": now,
        "updated_at": now
    })
    return result.inserted_id
