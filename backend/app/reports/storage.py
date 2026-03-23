"""
S3-compatible storage for PDF report files.
Supports AWS S3 and Backblaze B2 (S3-compatible API).
"""
from __future__ import annotations

import structlog

from app.config import settings

logger = structlog.get_logger(__name__)


def upload_report(pdf_bytes: bytes, scan_id: str) -> str:
    """
    Uploads a PDF to S3 and returns a signed download URL.
    The URL is valid for settings.S3_SIGNED_URL_TTL seconds (default 24h).
    """
    try:
        import boto3
        from botocore.exceptions import ClientError
    except ImportError:
        raise ImportError("S3 upload requires: pip install boto3")

    s3 = boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
    )

    key = f"reports/{scan_id}/report.pdf"

    try:
        s3.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
            ServerSideEncryption="AES256",
        )
        logger.info("report_uploaded", scan_id=scan_id, key=key)
    except Exception as exc:
        logger.error("report_upload_failed", scan_id=scan_id, error=str(exc))
        raise

    signed_url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=settings.S3_SIGNED_URL_TTL,
    )
    return signed_url


def upload_report_local(pdf_bytes: bytes, scan_id: str) -> str:
    """
    Development fallback — saves PDF to a shared volume and returns an API download URL.
    NOT for production use.
    """
    import os

    report_dir = "/app/report_files"
    os.makedirs(report_dir, exist_ok=True)
    path = f"{report_dir}/{scan_id}.pdf"
    with open(path, "wb") as f:
        f.write(pdf_bytes)
    logger.info("report_saved_local", path=path)
    return f"/reports/{scan_id}/download"
