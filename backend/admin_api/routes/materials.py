from flask import Blueprint, request, jsonify
from db.client import get_db
from db.models.material import create_material

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