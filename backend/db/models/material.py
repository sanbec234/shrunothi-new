from datetime import datetime
from bson import ObjectId

def serialize_material(doc):
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title"),
        "author": doc.get("author"),
        "genreId": str(doc["genreId"]) if doc.get("genreId") else None,
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
