import uuid

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis
from app.core.response import ok, created, no_content
from app.dependencies import ApiKey, RequestID
from app.shield import service
from app.shield.proxy import run_inspection, invalidate_policy_cache
from app.shield.schemas import (
    InspectRequest,
    InspectResponse,
    PolicyCreate,
    PolicyUpdate,
    PolicyResponse,
    PolicyListResponse,
    ViolationResponse,
    ViolationListResponse,
)

router = APIRouter()


# ── Inspection (hot path — no auth required, SDK uses this) ───────────────

@router.post("/inspect", response_model=InspectResponse, summary="Inspect text for policy violations")
async def inspect(
    body: InspectRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """
    The Shield SDK calls this on every LLM prompt and response.
    Returns allow/block/redact decision with matched violations.
    Target: <30ms p95 response time.
    """
    result = await run_inspection(body, db, redis)
    return result


# ── Policy CRUD ────────────────────────────────────────────────────────────

@router.post("/policies", status_code=201, summary="Create a DLP policy")
async def create_policy(
    body: PolicyCreate,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    request_id: RequestID = None,
):
    policy = await service.create_policy(db, body)
    await invalidate_policy_cache(redis)
    return created(PolicyResponse.model_validate(policy).model_dump(), request_id=request_id)


@router.get("/policies", summary="List all DLP policies")
async def list_policies(
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
    active_only: bool = Query(False),
):
    policies = await service.list_policies(db, active_only=active_only)
    data = PolicyListResponse(
        policies=[PolicyResponse.model_validate(p) for p in policies],
        total=len(policies),
    )
    return ok(data.model_dump(), request_id=request_id)


@router.get("/policies/{policy_id}", summary="Get a single policy")
async def get_policy(
    policy_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    policy = await service.get_policy(db, policy_id)
    return ok(PolicyResponse.model_validate(policy).model_dump(), request_id=request_id)


@router.patch("/policies/{policy_id}", summary="Update a policy")
async def update_policy(
    policy_id: uuid.UUID,
    body: PolicyUpdate,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    request_id: RequestID = None,
):
    policy = await service.update_policy(db, policy_id, body)
    await invalidate_policy_cache(redis)
    return ok(PolicyResponse.model_validate(policy).model_dump(), request_id=request_id)


@router.delete("/policies/{policy_id}", status_code=204, summary="Delete a policy")
async def delete_policy(
    policy_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    from app.core.exceptions import PolicyNotFound
    deleted = await service.delete_policy(db, policy_id)
    if not deleted:
        raise PolicyNotFound()
    await invalidate_policy_cache(redis)
    return no_content()


# ── Violations ─────────────────────────────────────────────────────────────

@router.get("/violations", summary="List violation log")
async def list_violations(
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
    policy_id: uuid.UUID | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = Query(None),
):
    violations, total = await service.list_violations(
        db, policy_id=policy_id, limit=limit, cursor=cursor
    )
    next_cursor = str(violations[-1].id) if len(violations) == limit else None
    data = ViolationListResponse(
        violations=[ViolationResponse.model_validate(v) for v in violations],
        total=total,
        cursor=next_cursor,
    )
    return ok(data.model_dump(), request_id=request_id, meta={"total": total})
