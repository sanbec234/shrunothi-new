from flask import Blueprint, jsonify, current_app, request
from datetime import datetime
import logging
from extensions import limiter

logger = logging.getLogger(__name__)

bp = Blueprint("announcements", __name__)


def serialize_announcement(a):
    """Serialize announcement for public API"""
    print(f"📦 Serializing announcement: {a.get('_id')}")
    serialized = {
        "id": str(a["_id"]),
        "title": a.get("title", ""),
        "imageUrl": a.get("image_url", ""),
    }
    print(f"✅ Serialized result: {serialized}")
    return serialized


@bp.route("/announcements/active", methods=["GET", "OPTIONS"])
@limiter.limit("500 per minute")
def get_active_announcements():
    """
    Get all currently active announcements.
    
    Filters by:
    - is_active = True
    - Current time is within start_at and end_at range (if set)
    
    Public endpoint - no authentication required
    Rate limited to prevent abuse
    """
    print("\n" + "="*60)
    print("🚀 GET /announcements/active called")
    print("="*60)
    
    # Handle CORS preflight
    if request.method == "OPTIONS":
        print("✅ OPTIONS request - returning 200")
        return "", 200
    
    try:
        # Verify database connection
        if not hasattr(current_app, 'db'):
            print("❌ ERROR: Database not available in app context")
            logger.error("Database not available in app context")
            return jsonify({"error": "Service unavailable"}), 503
        
        print("✅ Database connection available")
        
        # Get current time
        now = datetime.utcnow()
        print(f"⏰ Current UTC time: {now}")
        
        # Query for active announcements
        query = {"is_active": True}
        print(f"🔍 MongoDB query: {query}")
        
        # Count total announcements
        total_count = current_app.db.announcements.count_documents({})
        active_count = current_app.db.announcements.count_documents(query)
        print(f"📊 Total announcements in DB: {total_count}")
        print(f"📊 Active announcements in DB: {active_count}")
        
        # Find announcements sorted by creation date
        docs = current_app.db.announcements.find(query).sort("created_at", -1)
        
        # Convert cursor to list for debugging
        docs_list = list(docs)
        print(f"📋 Found {len(docs_list)} active announcement(s)")
        
        # Filter by time range
        active_announcements = []
        
        for i, doc in enumerate(docs_list):
            print(f"\n--- Processing announcement {i+1}/{len(docs_list)} ---")
            print(f"ID: {doc.get('_id')}")
            print(f"Title: {doc.get('title')}")
            print(f"Image URL: {doc.get('image_url')}")
            print(f"Is Active: {doc.get('is_active')}")
            
            start_at = doc.get("start_at")
            end_at = doc.get("end_at")
            
            print(f"Start At: {start_at} (type: {type(start_at)})")
            print(f"End At: {end_at} (type: {type(end_at)})")
            
            # If no time constraints, include it
            if not start_at and not end_at:
                print("✅ No time constraints - including announcement")
                active_announcements.append(serialize_announcement(doc))
                continue
            
            # Check if current time is within range
            is_after_start = not start_at or now >= start_at
            is_before_end = not end_at or now <= end_at
            
            print(f"Is after start? {is_after_start}")
            print(f"Is before end? {is_before_end}")
            
            if is_after_start and is_before_end:
                print("✅ Within time range - including announcement")
                active_announcements.append(serialize_announcement(doc))
            else:
                print("❌ Outside time range - excluding announcement")
        
        print(f"\n" + "="*60)
        print(f"🎯 Final result: {len(active_announcements)} announcement(s) to return")
        print(f"📤 Response data: {active_announcements}")
        print("="*60 + "\n")
        
        logger.info(f"Fetched {len(active_announcements)} active announcements")
        
        return jsonify(active_announcements), 200
        
    except Exception as e:
        print(f"\n❌ EXCEPTION OCCURRED:")
        print(f"Type: {type(e).__name__}")
        print(f"Message: {str(e)}")
        import traceback
        print(f"Traceback:\n{traceback.format_exc()}")
        
        logger.error(f"Error fetching active announcements: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch announcements"}), 500
