from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime
import pytz
from auth.auth_guard import require_admin

IST = pytz.timezone("Asia/Kolkata")

bp = Blueprint("admin_announcements", __name__)

# -------------------------
# Serializer (MANDATORY)
# -------------------------
def serialize_announcement(a):
    return {
        "id": str(a["_id"]),
        "title": a.get("title"),
        "imageUrl": a.get("image_url"),
        "isActive": a.get("is_active", True),
        "startAt": a.get("start_at").isoformat() if isinstance(a.get("start_at"), datetime) else a.get("start_at"),
        "endAt": a.get("end_at").isoformat() if isinstance(a.get("end_at"), datetime) else a.get("end_at"),
        "createdAt": (
            a["created_at"].isoformat()
            if isinstance(a.get("created_at"), datetime)
            else None
        ),
    }

def parse_datetime(value):
    """
    Parse datetime string (assumed IST) and convert to UTC datetime.
    Handles:
    - 2026-01-19T10:48
    - 2026-01-19T10:48:00
    - 2026-01-19T10:48:00.000Z
    """
    if not value:
        return None

    if isinstance(value, datetime):
        # If already tz-aware, normalize to UTC
        if value.tzinfo:
            return value.astimezone(pytz.UTC)
        # If naive, assume IST
        return IST.localize(value).astimezone(pytz.UTC)

    if not isinstance(value, str):
        return None

    try:
        value = value.replace("Z", "")

        if len(value) == 16:  # YYYY-MM-DDTHH:MM
            value += ":00"

        naive_dt = datetime.fromisoformat(value)

        # 🔑 THIS is the key line
        ist_dt = IST.localize(naive_dt)
        return ist_dt.astimezone(pytz.UTC)

    except Exception as e:
        print(f"⚠️ Failed to parse datetime: {value}, error: {e}")
        return None

# -------------------------
# GET announcements
# -------------------------
@bp.route("/admin/announcements", methods=["GET"])
@require_admin
def list_announcements():
    print("\n📋 Fetching all announcements for admin...")
    docs = current_app.db.announcements.find().sort("created_at", -1)
    announcements = [serialize_announcement(d) for d in docs]
    print(f"✅ Returning {len(announcements)} announcements")
    return jsonify(announcements)


# -------------------------
# POST announcement
# -------------------------
@bp.route("/admin/announcements", methods=["POST"])
@require_admin
def create_announcement():
    print("\n🆕 Creating new announcement...")
    data = request.json

    if not data:
        print("❌ No data provided")
        return jsonify({"error": "Missing payload"}), 400

    print(f"📦 Received data: {data}")

    # Parse datetime strings to datetime objects
    start_at = parse_datetime(data.get("startAt"))
    end_at = parse_datetime(data.get("endAt"))
    
    print(f"⏰ Parsed start_at: {start_at} (type: {type(start_at)})")
    print(f"⏰ Parsed end_at: {end_at} (type: {type(end_at)})")
    
    # Validate date range
    if start_at and end_at and end_at <= start_at:
        print("❌ Invalid date range: end_at must be after start_at")
        return jsonify({"error": "End time must be after start time"}), 400

    doc = {
        "title": data.get("title"),
        "image_url": data.get("imageUrl"),
        "is_active": data.get("isActive", True),
        "start_at": start_at,  # ✅ Now a datetime object
        "end_at": end_at,      # ✅ Now a datetime object
        "created_at": datetime.utcnow(),
    }

    print(f"💾 Saving to MongoDB: {doc}")

    result = current_app.db.announcements.insert_one(doc)
    doc["_id"] = result.inserted_id

    print(f"✅ Created announcement with ID: {result.inserted_id}")

    return jsonify(serialize_announcement(doc)), 201


# -------------------------
# UPDATE announcement
# -------------------------
@bp.route("/admin/announcements/<id>", methods=["PUT", "PATCH"])
@require_admin
def update_announcement(id):
    print(f"\n📝 Updating announcement: {id}")
    
    try:
        oid = ObjectId(id)
    except Exception:
        return jsonify({"error": "Invalid announcement ID"}), 400
    
    data = request.json
    print(f"📦 Update data: {data}")
    
    # Parse datetime strings to datetime objects
    start_at = parse_datetime(data.get("startAt"))
    end_at = parse_datetime(data.get("endAt"))
    
    print(f"⏰ Parsed start_at: {start_at} (type: {type(start_at)})")
    print(f"⏰ Parsed end_at: {end_at} (type: {type(end_at)})")
    
    # Validate date range
    if start_at and end_at and end_at <= start_at:
        print("❌ Invalid date range")
        return jsonify({"error": "End time must be after start time"}), 400
    
    update_data = {
        "title": data.get("title"),
        "image_url": data.get("imageUrl"),
        "is_active": data.get("isActive", True),
        "start_at": start_at,
        "end_at": end_at,
    }
    
    result = current_app.db.announcements.update_one(
        {"_id": oid},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        print("❌ Announcement not found")
        return jsonify({"error": "Announcement not found"}), 404
    
    print("✅ Announcement updated successfully")
    return jsonify({"status": "updated"}), 200


# -------------------------
# DELETE announcement
# -------------------------
@bp.route("/admin/announcements/<id>", methods=["DELETE"])
@require_admin
def delete_announcement(id):
    print(f"\n🗑️ Deleting announcement: {id}")
    
    try:
        oid = ObjectId(id)
    except Exception:
        return jsonify({"error": "Invalid announcement ID"}), 400
    
    result = current_app.db.announcements.delete_one({"_id": oid})
    
    if result.deleted_count == 0:
        print("❌ Announcement not found")
        return jsonify({"error": "Announcement not found"}), 404
    
    print("✅ Announcement deleted successfully")
    return jsonify({"success": True})