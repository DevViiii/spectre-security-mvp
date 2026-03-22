import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Organization ───────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9\-]+$")
    plan: str = "pilot"


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    plan: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── User ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str = Field(..., max_length=255)
    name: str | None = None
    role: str = "member"


class UserResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    email: str
    name: str | None
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None

    model_config = {"from_attributes": True}


# ── API Client ─────────────────────────────────────────────────────────────

class ApiClientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    client_type: str = "sdk"
    scopes: str = "shield:inspect"


class ApiClientCreatedResponse(BaseModel):
    id: uuid.UUID
    name: str
    client_type: str
    key: str = Field(..., description="Full client secret — shown once only")
    key_prefix: str
    scopes: str
    created_at: datetime


class ApiClientResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    description: str | None
    client_type: str
    key_prefix: str
    scopes: str
    is_active: bool
    last_used_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
