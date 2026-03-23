"""
Scanner router — with rate limiting applied to scan creation.
POST /scans is limited to 10/minute per IP to prevent abuse.
"""
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFound
from app.core.response import ok, created, no_content
from app.dependencies import ApiKey, RequestID
from app.rate_limit import limiter
from app.scanner import service
from app.scanner.schemas import ScanCreate, ScanResponse, ScanDetailResponse, FindingResponse
from app.config import settings

router = APIRouter()


@router.post("", status_code=201, summary="Create and queue a new scan")
@limiter.limit(settings.RATE_LIMIT_SCAN_CREATE)
async def create_scan(
    request: Request,
    body: ScanCreate,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    scan = await service.create_scan(db, body)
    # Queue the scan task
    from app.worker.celery_app import celery_app
    celery_app.send_task(
        "worker.tasks.scan_tasks.run_scan",
        args=[str(scan.id)],
        queue="scans",
    )
    return created(ScanResponse.model_validate(scan).model_dump(), request_id=request_id)


@router.get("", summary="List all scans")
async def list_scans(
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
    limit: int = 20,
    offset: int = 0,
):
    scans, total = await service.list_scans(db, limit=limit, offset=offset)
    return ok(
        {
            "scans": [ScanResponse.model_validate(s).model_dump() for s in scans],
            "total": total,
            "limit": limit,
            "offset": offset,
        },
        request_id=request_id,
    )


@router.get("/{scan_id}", summary="Get scan detail with findings")
async def get_scan(
    scan_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    scan = await service.get_scan_with_findings(db, scan_id)
    if not scan:
        raise NotFound(f"Scan {scan_id} not found")
    data = ScanDetailResponse(
        **ScanResponse.model_validate(scan).model_dump(),
        findings=[FindingResponse.model_validate(f) for f in scan.findings],
    )
    return ok(data.model_dump(), request_id=request_id)


@router.delete("/{scan_id}", status_code=204, summary="Delete a scan")
async def delete_scan(
    scan_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
):
    deleted = await service.delete_scan(db, scan_id)
    if not deleted:
        raise NotFound(f"Scan {scan_id} not found")
    return no_content()
