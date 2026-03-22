import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFound
from app.core.response import ok, created, no_content
from app.dependencies import ApiKey, RequestID
from app.organizations import service
from app.organizations.schemas import (
    OrganizationCreate, OrganizationResponse,
    UserCreate, UserResponse,
    ApiClientCreate, ApiClientCreatedResponse, ApiClientResponse,
)

router = APIRouter()


# ── Organizations ──────────────────────────────────────────────────────────

@router.post("", status_code=201, summary="Create organization")
async def create_organization(
    body: OrganizationCreate,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    org = await service.create_organization(db, body)
    return created(OrganizationResponse.model_validate(org).model_dump(), request_id=request_id)


@router.get("", summary="List organizations")
async def list_organizations(
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    orgs = await service.list_organizations(db)
    return ok(
        {"organizations": [OrganizationResponse.model_validate(o).model_dump() for o in orgs]},
        request_id=request_id,
    )


@router.get("/{org_id}", summary="Get organization")
async def get_organization(
    org_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    org = await service.get_organization(db, org_id)
    if not org:
        raise NotFound(f"Organization {org_id} not found")
    return ok(OrganizationResponse.model_validate(org).model_dump(), request_id=request_id)


# ── Users ──────────────────────────────────────────────────────────────────

@router.post("/{org_id}/users", status_code=201, summary="Add user to organization")
async def create_user(
    org_id: uuid.UUID,
    body: UserCreate,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    org = await service.get_organization(db, org_id)
    if not org:
        raise NotFound(f"Organization {org_id} not found")
    user = await service.create_user(db, org_id, body)
    return created(UserResponse.model_validate(user).model_dump(), request_id=request_id)


@router.get("/{org_id}/users", summary="List users in organization")
async def list_users(
    org_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    users = await service.list_users(db, org_id)
    return ok(
        {"users": [UserResponse.model_validate(u).model_dump() for u in users]},
        request_id=request_id,
    )


# ── API Clients ────────────────────────────────────────────────────────────

@router.post("/{org_id}/clients", status_code=201, summary="Create API client")
async def create_api_client(
    org_id: uuid.UUID,
    body: ApiClientCreate,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    org = await service.get_organization(db, org_id)
    if not org:
        raise NotFound(f"Organization {org_id} not found")
    client, raw_secret = await service.create_api_client(db, org_id, body)
    data = ApiClientCreatedResponse(
        id=client.id,
        name=client.name,
        client_type=client.client_type,
        key=raw_secret,
        key_prefix=client.key_prefix,
        scopes=client.scopes,
        created_at=client.created_at,
    )
    return created(data.model_dump(), request_id=request_id)


@router.get("/{org_id}/clients", summary="List API clients")
async def list_api_clients(
    org_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    clients = await service.list_api_clients(db, org_id)
    return ok(
        {"clients": [ApiClientResponse.model_validate(c).model_dump() for c in clients]},
        request_id=request_id,
    )


@router.delete("/{org_id}/clients/{client_id}", status_code=204, summary="Revoke API client")
async def revoke_api_client(
    org_id: uuid.UUID,
    client_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
):
    revoked = await service.revoke_api_client(db, client_id)
    if not revoked:
        raise NotFound("API client not found or already revoked")
    return no_content()
