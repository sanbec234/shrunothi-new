from flask import Blueprint, request, jsonify
from functools import wraps
import os
import boto3
from datetime import timedelta
from auth.utils import verify_token

bp = Blueprint("admin_thumbnail_uploads", __name__, url_prefix="/admin")

# AWS S3 setup
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)
BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "shrunothi-content")

def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing Authorization header"}), 401

        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({"error": "Invalid Authorization header"}), 401

        user = verify_token(token)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        request.user = user
        return f(*args, **kwargs)

    return decorated_function

@bp.route("/thumbnail/upload", methods=["POST", "OPTIONS"])
@require_admin
def presign_thumbnail():
    if request.method == "OPTIONS":
        return "", 204

    # Get dimensions from request
    width = request.json.get("width")
    height = request.json.get("height")
    filename = request.json.get("filename", "thumbnail.jpg")

    # Validate dimensions
    if width != 279 or height != 225:
        return jsonify({"error": f"Image must be exactly 279×225px, got {width}×{height}px"}), 400

    # Validate file extension
    allowed_extensions = {"jpg", "jpeg", "png", "webp"}
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    if ext not in allowed_extensions:
        return jsonify({"error": f"File type .{ext} not allowed. Allowed: {', '.join(allowed_extensions)}"}), 400

    # Generate S3 key
    s3_key = f"material-thumbnails/{filename}"

    try:
        # Generate presigned POST URL
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": BUCKET_NAME, "Key": s3_key},
            ExpiresIn=3600,
        )

        # Construct public file URL
        file_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

        return jsonify({
            "uploadUrl": presigned_url,
            "fileUrl": file_url,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
