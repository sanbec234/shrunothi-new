import boto3
import os
import logging

logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_BUCKET = os.getenv("AWS_BUCKET_NAME")

if not AWS_BUCKET:
    logger.warning("AWS_BUCKET_NAME is not set — S3 operations will fail")

_access_key = os.getenv("AWS_ACCESS_KEY_ID")
_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

if _access_key and _secret_key:
    s3_client = boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=_access_key,
        aws_secret_access_key=_secret_key,
    )
else:
    s3_client = boto3.client("s3", region_name=AWS_REGION)