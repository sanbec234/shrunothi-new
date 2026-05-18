"""
Admin trash / recovery endpoints.

Lists soft-deleted items per collection and lets an admin restore them.

Endpoints:
  GET    /admin/trash/<collection>           — list soft-deleted docs
  POST   /admin/trash/<collection>/<id>/restore — un-delete a doc
  DELETE /admin/trash/<collection>/<id>      — permanently purge a single doc

Allowed collections: genres, podcasts, materials, self_help
"""

from flask import Blueprint, jsonify, request
from bson import ObjectId
from db.client import get_db
from auth.auth_guard import require_admin
from utils.audit import audit_log
from utils.soft_delete import list_deleted, restore

bp = Blueprint("admin_trash", __name__)

# Whitelist — only these collections support soft-delete + recovery.
ALLOWED = {"genres", "podcasts", "materials", "self_help"}


def _resolve_collection(name: str):
    if name not in ALLOWED:
        return None
    return getattr(get_db(), name)


@bp.route("/admin/trash/<collection>", methods=["GET"])
@require_admin
def list_trash(collection):
    coll = _resolve_collection(collection)
    if coll is None:
        return jsonify({"error": f"Unsupported collection: {collection}"}), 400

    items = []
    for doc in list_deleted(coll, limit=200):
        items.append({
            "id": str(doc["_id"]),
            "deleted_at": doc["deleted_at"].isoformat() if doc.get("deleted_at") else None,
            "deleted_by": doc.get("deleted_by"),
            # Best-effort preview: name/title field for display
            "name": doc.get("name") or doc.get("title") or "(no name)",
        })
    return jsonify({"items": items, "count": len(items)}), 200


@bp.route("/admin/trash/<collection>/<doc_id>/restore", methods=["POST"])
@require_admin
@audit_log("trash.restore")
def restore_doc(collection, doc_id):
    coll = _resolve_collection(collection)
    if coll is None:
        return jsonify({"error": f"Unsupported collection: {collection}"}), 400

    try:
        oid = ObjectId(doc_id)
    except Exception:
        return jsonify({"error": "Invalid id"}), 400

    if not restore(coll, oid):
        return jsonify({"error": "Not found or not deleted"}), 404

    return jsonify({"status": "restored"}), 200


@bp.route("/admin/trash/<collection>/<doc_id>", methods=["DELETE"])
@require_admin
@audit_log("trash.purge")
def purge_doc(collection, doc_id):
    """Permanently delete a single soft-deleted doc. Use with caution."""
    coll = _resolve_collection(collection)
    if coll is None:
        return jsonify({"error": f"Unsupported collection: {collection}"}), 400

    try:
        oid = ObjectId(doc_id)
    except Exception:
        return jsonify({"error": "Invalid id"}), 400

    # Only allow purging docs that are already soft-deleted (extra safety)
    result = coll.delete_one({"_id": oid, "deleted_at": {"$exists": True}})
    if result.deleted_count == 0:
        return jsonify({"error": "Not found or not in trash"}), 404

    return jsonify({"status": "purged"}), 200
