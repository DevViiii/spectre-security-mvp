from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.response import ok
from app.dependencies import ApiKey, RequestID
from app.audit import service
from app.audit.schemas import AuditEventResponse, AuditListResponse

router = APIRouter()


@router.get("", summary="List audit log events")
async def list_audit_events(
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
    event_type: str | None = Query(None, description="Filter by event type"),
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = Query(None),
):
    """
    Returns a reverse-chronological audit log of all platform events.
    Filterable by event_type. Cursor-paginated.
    """
    events, total = await service.list_events(
        db, event_type=event_type, limit=limit, cursor=cursor
    )
    next_cursor = str(events[-1].id) if len(events) == limit else None
    data = AuditListResponse(
        events=[AuditEventResponse.model_validate(e) for e in events],
        total=total,
        cursor=next_cursor,
    )
    return ok(data.model_dump(), request_id=request_id, meta={"total": total, "cursor": next_cursor})
