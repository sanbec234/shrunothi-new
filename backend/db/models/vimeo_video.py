from datetime import datetime


def serialize_vimeo_video(doc):
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title"),
        "vimeo_id": doc.get("vimeo_id"),
        "thumbnail_url": doc.get("thumbnail_url"),
        "created_at": doc["created_at"].isoformat() + "Z" if doc.get("created_at") else None,
    }


def create_vimeo_video(db, data):
    now = datetime.utcnow()
    result = db.vimeo_videos.insert_one({
        "title": data["title"],
        "vimeo_id": data["vimeo_id"],
        "thumbnail_url": data.get("thumbnail_url"),
        "created_at": now,
        "updated_at": now,
    })
    return result.inserted_id
