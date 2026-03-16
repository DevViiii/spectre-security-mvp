"""
Report task — generates a PDF and stores it in S3.
Triggered automatically after a scan completes, or manually via POST /reports/{scan_id}/generate.
"""
from __future__ import annotations

import asyncio
import uuid

import structlog

from app.worker.celery_app import celery_app

logger = structlog.get_logger(__name__)


@celery_app.task(
    name="worker.tasks.report_tasks.generate_report",
    bind=True,
    max_retries=2,
    default_retry_delay=60,
)
def generate_report(self, scan_id: str) -> dict:
    try:
        return asyncio.run(_generate_report_async(scan_id))
    except Exception as exc:
        logger.error("report_task_error", scan_id=scan_id, error=str(exc))
        raise self.retry(exc=exc)


async def _generate_report_async(scan_id: str) -> dict:
    from app.config import settings
    from app.core.database import AsyncSessionLocal
    from app.scanner import service as scan_service
    from app.reports.generator import generate_pdf_bytes, build_report_context
    from app.reports.storage import upload_report, upload_report_local

    scan_uuid = uuid.UUID(scan_id)
    log = logger.bind(scan_id=scan_id)

    async with AsyncSessionLocal() as db:
        scan = await scan_service.get_scan(db, scan_uuid)
        findings = scan.findings

        log.info("report_generation_started", grade=scan.grade, findings=len(findings))

        context = build_report_context(scan, findings)
        pdf_bytes = generate_pdf_bytes(context)

        # Upload: use S3 in staging/production, local fallback in development
        if settings.AWS_ACCESS_KEY_ID and not settings.is_development:
            report_url = upload_report(pdf_bytes, scan_id)
        else:
            report_url = upload_report_local(pdf_bytes, scan_id)

        # Write the URL back to the scan record
        scan.report_url = report_url
        await db.commit()

        log.info("report_generated", url=report_url, size_kb=round(len(pdf_bytes) / 1024, 1))
        return {"scan_id": scan_id, "report_url": report_url}
