"""
Auth router — rate limited key creation to prevent enumeration attacks.
POST /auth is limited to 5/minute per IP.
"""
import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service
from app.auth.schemas import ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyResponse
from app.core.database import get_db
from app.core.exceptions import NotFound
from app.core.response import ok, created, no_content
from app.config import settings
from app.dependencies import ApiKey, RequestID
from app.rate_limit import limiter

router = APIRouter()


@router.post("", status_code=201, summary="Create a new API key")
@limiter.limit(settings.RATE_LIMIT_AUTH_CREATE)
async def create_api_key(
    request: Request,
    body: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    key_obj, raw_key = await service.create_key(db, body)
    return created(
        ApiKeyCreatedResponse(
            id=key_obj.id,
            name=key_obj.name,
            key=raw_key,
            key_prefix=key_obj.key_prefix,
            created_at=key_obj.created_at,
        ).model_dump(),
        request_id=request_id,
    )


@router.get("", summary="List all API keys")
async def list_api_keys(
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    keys = await service.list_keys(db)
    return ok(
        {"keys": [ApiKeyResponse.model_validate(k).model_dump() for k in keys]},
        request_id=request_id,
    )


@router.delete("/{key_id}", status_code=204, summary="Revoke an API key")
async def revoke_api_key(
    key_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
):
    revoked = await service.revoke_key(db, key_id)
    if not revoked:
        raise NotFound(f"API key {key_id} not found or already revoked")
    return no_content()
