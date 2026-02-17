from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.material import create_material
from bson import ObjectId
from datetime import datetime
from auth.auth_guard import require_admin

bp = Blueprint("admin_materials", __name__)

# -------------------------------
# ADD MATERIAL
# POST /admin/materials
# -------------------------------
@bp.route("/admin/materials", methods=["POST"])
@require_admin
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


# -------------------------------
# UPDATE MATERIAL
# PUT or PATCH /admin/materials/<id>
# -------------------------------
@bp.route("/admin/materials/<material_id>", methods=["PUT", "PATCH"])
@require_admin
def update_material(material_id):
    db = get_db()

    try:
        oid = ObjectId(material_id)
    except Exception:
        return jsonify({ "error": "Invalid material id" }), 400

    data = request.get_json() or {}

    # Validate required fields
    for field in ["title", "author", "content", "genreId"]:
        if not data.get(field):
            return jsonify({ "error": f"{field} is required" }), 400

    # Validate genre exists
    try:
        genre_oid = ObjectId(data["genreId"])
    except Exception:
        return jsonify({ "error": "Invalid genreId" }), 400

    if not db.genres.find_one({ "_id": genre_oid }):
        return jsonify({ "error": "Genre not found" }), 400

    result = db.materials.update_one(
        { "_id": oid },
        { "$set": {
            "title": data["title"],
            "author": data["author"],
            "content": data["content"],
            "genreId": data["genreId"],  # keep STRING for consistency
            "updated_at": datetime.utcnow()
        }}
    )

    if result.matched_count == 0:
        return jsonify({ "error": "Material not found" }), 404

    return jsonify({ "status": "updated" }), 200


# -------------------------------
# DELETE MATERIAL
# DELETE /admin/materials/<id>
# -------------------------------
@bp.route("/admin/materials/<material_id>", methods=["DELETE", "OPTIONS"])
@require_admin
def delete_material(material_id):
    if request.method == "OPTIONS":
        return "", 200

    db = get_db()

    try:
        oid = ObjectId(material_id)
    except Exception:
        return jsonify({ "error": "Invalid material id" }), 400

    result = db.materials.delete_one({ "_id": oid })

    if result.deleted_count == 0:
        return jsonify({ "error": "Material not found" }), 404

    return jsonify({ "status": "deleted" }), 200