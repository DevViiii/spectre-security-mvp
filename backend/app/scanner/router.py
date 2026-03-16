import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.response import ok, created, no_content
from app.dependencies import ApiKey, RequestID
from app.scanner import service
from app.scanner.schemas import (
    ScanCreate,
    ScanResponse,
    ScanDetailResponse,
    ScanListResponse,
    FindingResponse,
)

router = APIRouter()


@router.post("", status_code=201, summary="Create and queue a new scan")
async def create_scan(
    body: ScanCreate,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    """
    Creates a scan record and enqueues the attack job.
    Returns immediately with status=pending.
    Poll GET /scans/{id} for progress.
    """
    scan = await service.create_scan(db, body)

    # Enqueue the Celery job — imported here to avoid circular dependency at module load
    from app.worker.celery_app import celery_app
    celery_app.send_task("worker.tasks.scan_tasks.run_scan", args=[str(scan.id)])

    return created(ScanResponse.model_validate(scan).model_dump(), request_id=request_id)


@router.get("", summary="List all scans")
async def list_scans(
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
    limit: int = Query(20, ge=1, le=100),
    cursor: str | None = Query(None),
):
    scans, total = await service.list_scans(db, limit=limit, cursor=cursor)
    next_cursor = str(scans[-1].id) if len(scans) == limit else None
    data = ScanListResponse(
        scans=[ScanResponse.model_validate(s) for s in scans],
        total=total,
        cursor=next_cursor,
    )
    return ok(data.model_dump(), request_id=request_id, meta={"total": total, "cursor": next_cursor})


@router.get("/{scan_id}", summary="Get scan detail with findings")
async def get_scan(
    scan_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    scan = await service.get_scan(db, scan_id)
    data = ScanDetailResponse(
        **ScanResponse.model_validate(scan).model_dump(),
        findings=[FindingResponse.model_validate(f) for f in scan.findings],
    )
    return ok(data.model_dump(), request_id=request_id)


@router.delete("/{scan_id}", status_code=204, summary="Delete a scan and its findings")
async def delete_scan(
    scan_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
):
    from app.core.exceptions import ScanNotFound
    deleted = await service.delete_scan(db, scan_id)
    if not deleted:
        raise ScanNotFound()
    return no_content()
