import uuid
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.models import AuditEvent


async def log_event(
    db: AsyncSession,
    *,
    event_type: str,
    actor: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> AuditEvent:
    """
    Appends an immutable audit event.
    Called by other services after significant actions — never by routers directly.

    event_type conventions:
      api_key.created, api_key.revoked
      scan.created, scan.completed, scan.failed
      policy.created, policy.updated, policy.deleted
      report.generated
    """
    event = AuditEvent(
        id=uuid.uuid4(),
        event_type=event_type,
        actor=actor,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        details=details,
    )
    db.add(event)
    await db.flush()
    return event


async def list_events(
    db: AsyncSession,
    *,
    event_type: str | None = None,
    limit: int = 50,
    cursor: str | None = None,
) -> tuple[list[AuditEvent], int]:
    query = select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)

    if event_type:
        query = query.where(AuditEvent.event_type == event_type)
    if cursor:
        query = query.where(AuditEvent.id < uuid.UUID(cursor))

    result = await db.execute(query)
    events = list(result.scalars().all())

    count_query = select(func.count(AuditEvent.id))
    if event_type:
        count_query = count_query.where(AuditEvent.event_type == event_type)
    total = (await db.execute(count_query)).scalar_one()

    return events, total
