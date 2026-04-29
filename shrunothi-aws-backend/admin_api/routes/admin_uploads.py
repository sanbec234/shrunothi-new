from flask import Blueprint, request, jsonify
import boto3
import os
import uuid
from dotenv import load_dotenv
from auth.auth_guard import require_admin

# 🔑 Load .env ONLY for local development
load_dotenv()

bp = Blueprint("admin_uploads", __name__)

AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
BUCKET = os.environ.get("AWS_BUCKET_NAME")

if not BUCKET:
    raise RuntimeError("AWS_BUCKET_NAME not set")

s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
)

@bp.route("/admin/uploads/presign", methods=["POST", "OPTIONS"])
@require_admin
def presign_upload():
    # 🟡 Handle CORS preflight explicitly (important)
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json() or {}

    filename = data.get("filename")
    content_type = data.get("contentType")

    if not filename or not content_type:
        return jsonify({"error": "filename and contentType required"}), 400

    ext = filename.rsplit(".", 1)[-1].lower()

    # 🔒 Optional safety: allow only images
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        return jsonify({"error": "Unsupported file type"}), 400

    key = f"announcements/{uuid.uuid4()}.{ext}"

    try:
        upload_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=300,  # 5 minutes
        )

        file_url = f"https://{BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"

        return jsonify({
            "uploadUrl": upload_url,
            "fileUrl": file_url
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
