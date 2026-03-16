import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AuditEventResponse(BaseModel):
    id: uuid.UUID
    event_type: str
    actor: str | None
    resource_type: str | None
    resource_id: str | None
    details: dict[str, Any] | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditListResponse(BaseModel):
    events: list[AuditEventResponse]
    total: int
    cursor: str | None = None
