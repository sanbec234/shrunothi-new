import logging
from datetime import datetime, timezone
from functools import wraps
from flask import request
from db.client import get_db

log = logging.getLogger(__name__)


def audit_log(action: str):
    """
    Decorator that writes a record to db.audit_log after every mutating admin call.
    Usage:
        @require_admin
        @audit_log("material.create")
        def add_material(): ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            result = f(*args, **kwargs)
            try:
                db = get_db()
                body = request.get_json(silent=True) or {}
                db.audit_log.insert_one({
                    "actor": getattr(request, "user", {}).get("email", "unknown"),
                    "action": action,
                    "path": request.path,
                    "method": request.method,
                    "body_keys": list(body.keys()),
                    "path_params": dict(request.view_args or {}),
                    "ip": request.remote_addr,
                    "timestamp": datetime.now(timezone.utc),
                })
            except Exception:
                log.exception("audit_log: failed to write audit record for action=%s", action)
            return result
        return wrapper
    return decorator
