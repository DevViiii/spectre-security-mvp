import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Human-readable label")


class ApiKeyCreatedResponse(BaseModel):
    """Returned only once at creation — the raw key is never stored."""
    id: uuid.UUID
    name: str
    key: str = Field(..., description="Full API key — shown only once")
    key_prefix: str
    created_at: datetime


class ApiKeyResponse(BaseModel):
    """Safe representation — never includes the raw key."""
    id: uuid.UUID
    name: str
    key_prefix: str
    created_at: datetime
    last_used_at: datetime | None
    is_active: bool

    model_config = {"from_attributes": True}


class ApiKeyListResponse(BaseModel):
    keys: list[ApiKeyResponse]
