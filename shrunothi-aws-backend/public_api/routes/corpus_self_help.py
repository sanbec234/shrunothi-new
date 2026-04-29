from flask import Blueprint, jsonify
from db.client import get_db
from db.models.subscriber import is_subscriber
from auth.auth_guard import attach_optional_user
from extensions import limiter
import re


def strip_html(text: str) -> str:
    """Remove HTML tags and decode entities."""
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'&quot;', '"', text)
    return text.strip()


bp = Blueprint("public_corpus_self_help", __name__)

@bp.route("/corpus/self-help", methods=["GET"])
@limiter.limit("500 per minute")
def corpus_self_help():
    db = get_db()
    user = attach_optional_user()
    caller_is_subscriber = is_subscriber(db, user["email"]) if user else False

    docs = db.self_help.find()

    results = []
    for d in docs:
        subscriber_only = bool(d.get("subscriberOnly", False))
        locked = subscriber_only and not caller_is_subscriber
        # Hide preview for locked items so non-subscribers can't read content via list endpoint.
        if locked:
            preview = ""
        else:
            raw_content = d.get("html_content", "") or d.get("content", "")
            clean_text = strip_html(raw_content)
            preview = clean_text[:300]
        results.append({
            "id": str(d["_id"]),
            "title": d.get("title", ""),
            "author": d.get("author", "Unknown"),
            "preview": preview,
            "subscriberOnly": subscriber_only,
            "locked": locked,
        })

    return jsonify(results), 200
