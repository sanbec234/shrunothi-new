from flask import Blueprint, jsonify
from db.client import get_db
from db.models.self_help import serialize_self_help
from db.models.subscriber import is_subscriber
from auth.auth_guard import attach_optional_user
from extensions import limiter

bp = Blueprint("public_self_help", __name__)


@bp.route("/self-help", methods=["GET"])
@limiter.limit("500 per minute")
def list_self_help():
    db = get_db()
    user = attach_optional_user()
    caller_is_subscriber = is_subscriber(db, user["email"]) if user else False

    results = []
    for d in db.self_help.find():
        item = serialize_self_help(d)
        item["locked"] = bool(item.get("subscriberOnly")) and not caller_is_subscriber
        results.append(item)
    return jsonify(results), 200
