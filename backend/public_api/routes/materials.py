from flask import Blueprint, jsonify
from db.client import get_db
from db.models.material import serialize_material

bp = Blueprint("public_materials", __name__)

@bp.route("/materials", methods=["GET"])
def list_materials():
    db = get_db()
    docs = db.materials.find()
    return jsonify([serialize_material(d) for d in docs]), 200
