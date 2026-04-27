from datetime import datetime

def serialize_self_help(doc):
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "author": doc["author"],
        "source": doc.get("source"),
    }

def create_self_help(db, data):
    now = datetime.utcnow()
    result = db.self_help.insert_one({
        "title": data["title"],
        "author": data["author"],
        "content": data["content"],
        "created_at": now,
        "updated_at": now
    })
    return result.inserted_id
