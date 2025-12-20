from flask import Blueprint, jsonify
from bson import ObjectId
from db.client import get_db

bp = Blueprint("public_material", __name__)

@bp.route("/material/<material_id>", methods=["GET"])
def get_material(material_id):
    db = get_db()

    try:
        oid = ObjectId(material_id)
    except Exception:
        return jsonify({ "error": "Invalid id" }), 400

    # 1️⃣ Try materials
    doc = db.materials.find_one({ "_id": oid })
    if doc:
        return jsonify({
            "id": material_id,
            "content": doc.get("content", "")
        }), 200

    # 2️⃣ Try self_help (confirmed from Atlas)
    doc = db.self_help.find_one({ "_id": oid })
    if doc:
        return jsonify({
            "id": material_id,
            "content": doc.get("content", "")
        }), 200

    return jsonify({ "error": "File not found" }), 404
