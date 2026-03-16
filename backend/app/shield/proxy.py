"""
Shield proxy — the hot path.
POST /shield/inspect is called by the Python SDK on every LLM I/O.
Must return in <30ms p95.
"""
from __future__ import annotations

import time

import redis.asyncio as aioredis
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.shield import service as shield_service
from app.shield.dlp.engine import inspect, PolicyMatch
from app.shield.models import Policy
from app.shield.schemas import InspectRequest, InspectResponse, ViolationDetail

logger = structlog.get_logger(__name__)

_POLICY_CACHE_KEY = "shield:active_policies"


async def run_inspection(
    request: InspectRequest,
    db: AsyncSession,
    redis: aioredis.Redis,
) -> InspectResponse:
    """
    Main inspection entry point.
    1. Load active policies (from Redis cache or Postgres).
    2. Run DLP engine pipeline.
    3. Persist violations for any non-alert matches.
    4. Return allow/block/redact decision.
    """
    start = time.perf_counter()
    policies = await _load_policies(db, redis)

    result = inspect(
        text=request.text,
        direction=request.direction,
        policies=policies,
    )

    # Persist violations (fire-and-forget for non-blocking matches; awaited for blocks)
    violation_details: list[ViolationDetail] = []
    for match in result.matches:
        await shield_service.log_violation(
            db,
            policy_id=match.policy_id,
            direction=request.direction,
            action_taken=match.action,
            matched_pattern=match.matched_pattern,
            context_excerpt=request.text[:500],
            metadata=request.context,
        )
        violation_details.append(ViolationDetail(
            policy_id=match.policy_id,
            policy_name=match.policy_name,
            rule_type=match.rule_type,
            action=match.action,
            matched_pattern=match.matched_pattern,
            match_location=request.direction,
        ))

    total_ms = (time.perf_counter() - start) * 1000

    if total_ms > settings.SHIELD_MAX_INSPECTION_MS * 2:
        logger.warning("inspection_slow", duration_ms=round(total_ms, 2))

    return InspectResponse(
        allowed=result.allowed,
        action=result.action if result.matches else "allow",
        modified_text=result.modified_text,
        violations=violation_details,
        inspection_ms=round(total_ms, 2),
    )


async def _load_policies(db: AsyncSession, redis: aioredis.Redis) -> list[Policy]:
    """
    Returns active policies. Uses a Redis TTL cache to avoid a DB round-trip
    on every LLM call. Cache is invalidated on policy create/update/delete.

    Note: Returns ORM objects, which means after the initial DB fetch the
    objects are detached — this is intentional. The engine only reads
    policy attributes; no lazy loading occurs.
    """
    import json
    import pickle

    cache_hit = await redis.get(_POLICY_CACHE_KEY)
    if cache_hit:
        try:
            return pickle.loads(cache_hit)
        except Exception:
            pass  # fall through to DB

    policies = await shield_service.list_active_policies(db)

    try:
        serialized = pickle.dumps(policies)
        await redis.set(_POLICY_CACHE_KEY, serialized, ex=settings.SHIELD_POLICY_CACHE_TTL)
    except Exception as exc:
        logger.warning("policy_cache_write_failed", error=str(exc))

    return policies


async def invalidate_policy_cache(redis: aioredis.Redis) -> None:
    """Call after any policy mutation to force a fresh DB read on next inspection."""
    await redis.delete(_POLICY_CACHE_KEY)
