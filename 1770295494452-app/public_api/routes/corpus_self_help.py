from flask import Blueprint, jsonify
from db.client import get_db
from extensions import limiter
from extensions import limiter

bp = Blueprint("public_corpus_self_help", __name__)

@bp.route("/corpus/self-help", methods=["GET"])
@limiter.limit("500 per minute")
def corpus_self_help():
    db = get_db()

    docs = db.self_help.find()

    results = []
    for d in docs:
        content = d.get("content", "")
        results.append({
            "id": str(d["_id"]),
            "title": d.get("title", ""),
            "author": d.get("author", "Unknown"),
            "preview": content[:300]
        })

    return jsonify(results), 200