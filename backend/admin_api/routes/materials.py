from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.material import create_material
from bson import ObjectId

bp = Blueprint("admin_materials", __name__)

@bp.route("/admin/materials", methods=["POST"])
def add_material():
    data = request.get_json() or {}

    required = ["title", "author", "content", "genreId"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    db = get_db()
    material_id = create_material(db, data)

    return jsonify({
        "id": str(material_id),
        "title": data["title"]
    }), 201

@bp.route("/admin/materials/<material_id>", methods=["PATCH", "OPTIONS"])
def update_material(material_id):
    if request.method == "OPTIONS":
        return "", 200

    db = get_db()

    try:
        oid = ObjectId(material_id)
    except Exception:
        return jsonify({ "error": "Invalid material id" }), 400

    data = request.get_json() or {}

    update = {
        k: v for k, v in data.items()
        if k in ["title", "author", "content", "genreId"]
    }

    if "genreId" in update:
        if update["genreId"]:
            update["genreId"] = ObjectId(update["genreId"])
        else:
            update.pop("genreId")


    db.materials.update_one(
        { "_id": oid },
        { "$set": update }
    )

    return jsonify({ "status": "updated" }), 200