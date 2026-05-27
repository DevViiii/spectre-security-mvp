"""
Shield router — with input validation and rate limiting on inspect endpoint.
POST /shield/inspect is limited to 300/minute — generous for SDK use but capped.
Text length is validated before any processing occurs.
"""
import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.config import settings
from app.core.database import get_db
from app.core.exceptions import NotFound, ValidationError
from app.core.redis import get_redis
from app.core.response import ok, created, no_content
from app.dependencies import ApiKey, RequestID
from app.rate_limit import limiter
from app.shield import service
from app.shield.proxy import run_inspection
from app.shield.schemas import (
    InspectRequest,
    InspectResponse,
    PolicyCreate,
    PolicyUpdate,
    PolicyResponse,
    ViolationResponse,
)

router = APIRouter()


@router.post("/inspect", summary="Inspect text for policy violations")
@limiter.limit(settings.RATE_LIMIT_SHIELD_INSPECT)
async def inspect(
    request: Request,
    body: InspectRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    request_id: RequestID = None,
):
    """
    The Shield SDK calls this on every LLM prompt and response.
    Returns allow/block/redact decision with matched violations.
    Target: <30ms p95 response time.
    """
    # Validate text length before any processing
    if len(body.text) > settings.SHIELD_MAX_TEXT_LENGTH:
        raise ValidationError(
            f"Text exceeds maximum length of {settings.SHIELD_MAX_TEXT_LENGTH:,} characters. "
            f"Received {len(body.text):,} characters."
        )

    result = await run_inspection(body, db, redis)
    return ok(result.model_dump(), request_id=request_id)


# ── Policies ───────────────────────────────────────────────────────────────

@router.post("/policies", status_code=201, summary="Create a DLP policy")
async def create_policy(
    body: PolicyCreate,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    request_id: RequestID = None,
):
    policy = await service.create_policy(db, body)
    from app.shield.proxy import invalidate_policy_cache
    await invalidate_policy_cache(redis)
    return created(PolicyResponse.model_validate(policy).model_dump(), request_id=request_id)


@router.get("/policies", summary="List all DLP policies")
async def list_policies(
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
):
    policies = await service.list_policies(db)
    return ok(
        {"policies": [PolicyResponse.model_validate(p).model_dump() for p in policies]},
        request_id=request_id,
    )


@router.patch("/policies/{policy_id}", summary="Update a DLP policy")
async def update_policy(
    policy_id: uuid.UUID,
    body: PolicyUpdate,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    request_id: RequestID = None,
):
    policy = await service.update_policy(db, policy_id, body)
    if not policy:
        raise NotFound(f"Policy {policy_id} not found")
    from app.shield.proxy import invalidate_policy_cache
    await invalidate_policy_cache(redis)
    return ok(PolicyResponse.model_validate(policy).model_dump(), request_id=request_id)


@router.delete("/policies/{policy_id}", status_code=204, summary="Delete a DLP policy")
async def delete_policy(
    policy_id: uuid.UUID,
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    deleted = await service.delete_policy(db, policy_id)
    if not deleted:
        raise NotFound(f"Policy {policy_id} not found")
    from app.shield.proxy import invalidate_policy_cache
    await invalidate_policy_cache(redis)
    return no_content()


@router.get("/violations", summary="List Shield violations")
async def list_violations(
    _key: ApiKey,
    db: AsyncSession = Depends(get_db),
    request_id: RequestID = None,
    limit: int = 50,
    offset: int = 0,
):
    violations, total = await service.list_violations(db, limit=limit, offset=offset)
    return ok(
        {
            "violations": [ViolationResponse.from_orm_with_policy(v).model_dump() for v in violations],
            "total": total,
        },
        request_id=request_id,
    )
