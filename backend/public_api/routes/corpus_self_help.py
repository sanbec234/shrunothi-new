from flask import Blueprint, jsonify
from db.client import get_db

bp = Blueprint("public_corpus_self_help", __name__)

@bp.route("/corpus/self-help", methods=["GET"])
def corpus_self_help():
    db = get_db()

    docs = db.self_help.find()

    results = []
    for d in docs:
        content = d.get("content", "")
        results.append({
            "id": str(d["_id"]),
            "filename": d.get("title", ""),
            "author": d.get("author", "Unknown"),
            "preview": content[:300]
        })

    return jsonify(results), 200