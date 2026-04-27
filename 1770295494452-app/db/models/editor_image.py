from datetime import datetime


def create_editor_image(db, data):
    """
    Store editor image metadata in MongoDB
    
    Args:
        db: MongoDB database connection
        data: dict with 'imageUrl', 'filename', 'contentType'
    
    Returns:
        inserted_id: MongoDB ObjectId
    """
    now = datetime.utcnow()

    doc = {
        "imageUrl": data["imageUrl"],
        "filename": data.get("filename", ""),
        "contentType": data.get("contentType", ""),
        "uploadedAt": now,
    }

    result = db.editor_images.insert_one(doc)
    return result.inserted_id


def get_editor_images(db, limit=50):
    """
    Get list of uploaded editor images
    
    Args:
        db: MongoDB database connection
        limit: max number of images to return
    
    Returns:
        list of image documents
    """
    cursor = db.editor_images.find().sort("uploadedAt", -1).limit(limit)
    
    images = []
    for img in cursor:
        images.append({
            "id": str(img["_id"]),
            "imageUrl": img["imageUrl"],
            "filename": img.get("filename", ""),
            "contentType": img.get("contentType", ""),
            "uploadedAt": img.get("uploadedAt")
        })
    
    return images


def delete_editor_image(db, image_id):
    """
    Delete editor image record from MongoDB
    
    Args:
        db: MongoDB database connection
        image_id: ObjectId as string
    
    Returns:
        bool: True if deleted, False otherwise
    """
    from bson import ObjectId
    
    try:
        oid = ObjectId(image_id)
    except Exception:
        return False
    
    result = db.editor_images.delete_one({"_id": oid})
    return result.deleted_count > 0