import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFound
from app.core.response import ok, created, no_content
from app.dependencies import ApiKey, RequestID
from app.auth import service
from app.auth.schemas import ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyResponse, ApiKeyListResponse

router = APIRouter()


@router.post("", response_model=None, status_code=201, summary="Create API key")
async def create_api_key(
    body: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    """
    Creates a new API key.
    The full key is returned exactly once and is not recoverable.
    """
    api_key, raw_key = await service.create_api_key(db, body.name)
    data = ApiKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key=raw_key,
        key_prefix=api_key.key_prefix,
        created_at=api_key.created_at,
    )
    return created(data.model_dump(), request_id=request_id)


@router.get("", summary="List active API keys")
async def list_api_keys(
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    keys = await service.list_api_keys(db)
    data = ApiKeyListResponse(keys=[ApiKeyResponse.model_validate(k) for k in keys])
    return ok(data.model_dump(), request_id=request_id)


@router.delete("/{key_id}", summary="Revoke API key")
async def revoke_api_key(
    key_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
):
    revoked = await service.revoke_api_key(db, key_id)
    if not revoked:
        raise NotFound(f"API key {key_id} not found or already revoked")
    return no_content()
