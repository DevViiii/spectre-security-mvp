import uuid

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ScanNotFound, ReportNotFound
from app.core.response import ok
from app.dependencies import ApiKey, RequestID

router = APIRouter()


@router.post("/{scan_id}/generate", status_code=202, summary="Trigger PDF report generation")
async def generate_report(
    scan_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    """
    Queues a PDF report generation job for a completed scan.
    Returns 202 Accepted — the report URL will appear on the scan record
    once the job completes (poll GET /scans/{id}).
    """
    from app.scanner.service import get_scan
    scan = await get_scan(db, scan_id)

    if scan.status != "completed":
        from app.core.exceptions import ValidationError
        raise ValidationError("Report can only be generated for completed scans")

    from app.worker.celery_app import celery_app
    celery_app.send_task("worker.tasks.report_tasks.generate_report", args=[str(scan_id)])

    return ok(
        {"message": "Report generation queued", "scan_id": str(scan_id)},
        request_id=request_id,
        status_code=202,
    )


@router.get("/{scan_id}", summary="Get signed download URL for a scan report")
async def get_report_url(
    scan_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    """
    Returns a signed S3 URL for downloading the PDF report.
    URL is valid for 24 hours.
    """
    from app.scanner.service import get_scan
    scan = await get_scan(db, scan_id)

    if not scan.report_url:
        raise ReportNotFound("Report not yet generated. POST /reports/{scan_id}/generate first.")

    return ok(
        {"report_url": scan.report_url, "scan_id": str(scan_id)},
        request_id=request_id,
    )
