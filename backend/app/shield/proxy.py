"""
Shield proxy — the hot path.
POST /shield/inspect is called by the Python SDK on every LLM I/O.

v1 pipeline:
  1. Load active DB policies (Redis-cached)
  2. Run DetectionEngine (regex + heuristic rules)
  3. Run DB policy matchers (customer-defined)
  4. Merge, determine action, persist violations
  5. Return InspectResponse
"""
from __future__ import annotations

import time
from datetime import datetime

import redis.asyncio as aioredis
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

import uuid

_REQUIRED_POLICY_FIELDS = frozenset({
    "id", "name", "rule_type", "rule_config", "action",
    "applies_to", "is_active", "is_builtin",
})

from app.config import settings
from app.shield import service as shield_service
from app.shield.dlp.engine import inspect, PolicyMatch
from app.shield.dlp.detection.engine import get_engine
from app.shield.models import Policy
from app.shield.schemas import InspectRequest, InspectResponse, ViolationDetail

_BUILTIN_POLICY_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")

logger = structlog.get_logger(__name__)

_POLICY_CACHE_KEY = "shield:active_policies"
_builtin_policy_ensured = False


async def _ensure_builtin_policy(db: AsyncSession) -> None:
    """Create the sentinel policy row for built-in detection violations if missing."""
    global _builtin_policy_ensured
    if _builtin_policy_ensured:
        return
    existing = await db.get(Policy, _BUILTIN_POLICY_ID)
    if not existing:
        db.add(Policy(
            id=_BUILTIN_POLICY_ID,
            name="Built-in Detection",
            description="Sentinel policy for built-in detection engine findings",
            rule_type="regex",
            rule_config={"pattern": ".*"},
            action="alert",
            applies_to="both",
            is_active=False,
            is_builtin=True,
        ))
        await db.flush()
    _builtin_policy_ensured = True


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
    await _ensure_builtin_policy(db)
    policies = await _load_policies(db, redis)

    result = inspect(
        text=request.text,
        direction=request.direction,
        policies=policies,
    )

    # Run the built-in detection engine (injection, leak, jailbreak, secrets, heuristics)
    detection = get_engine().run(request.text, direction=request.direction)

    # Persist violations for DB policy matches
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

    # Surface detection engine findings as violations and persist them
    for finding in detection.findings:
        action = "block" if finding.severity == "critical" else "alert"
        await shield_service.log_violation(
            db,
            policy_id=_BUILTIN_POLICY_ID,
            direction=finding.direction,
            action_taken=action,
            matched_pattern=finding.matched_text[:200],
            context_excerpt=request.text[:500],
            metadata=request.context,
        )
        violation_details.append(ViolationDetail(
            policy_id=_BUILTIN_POLICY_ID,
            policy_name=finding.rule_name,
            rule_type=finding.category,
            action=action,
            matched_pattern=finding.matched_text,
            match_location=finding.direction,
        ))

    # Determine overall action: detection engine can escalate
    overall_action = result.action if result.matches else "allow"
    allowed = result.allowed
    if detection.findings:
        if detection.verdict in ("CRITICAL", "HIGH"):
            overall_action = "block"
            allowed = False
        elif overall_action == "allow":
            overall_action = "alert"

    total_ms = (time.perf_counter() - start) * 1000

    if total_ms > settings.SHIELD_MAX_INSPECTION_MS * 2:
        logger.warning("inspection_slow", duration_ms=round(total_ms, 2))

    return InspectResponse(
        allowed=allowed,
        action=overall_action,
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

    cache_hit = await redis.get(_POLICY_CACHE_KEY)
    if cache_hit:
        cached = _deserialize_cached_policies(cache_hit)
        if cached is not None:
            return cached
        # Invalid cache payload — nuke it so the next writer replaces it.
        await redis.delete(_POLICY_CACHE_KEY)

    policies = await shield_service.list_active_policies(db)

    try:
        serialized = json.dumps([
            {c.name: getattr(p, c.name) for c in p.__table__.columns}
            for p in policies
        ], default=str)
        await redis.set(_POLICY_CACHE_KEY, serialized, ex=settings.SHIELD_POLICY_CACHE_TTL)
    except Exception as exc:
        logger.warning("policy_cache_write_failed", error=str(exc))

    return policies


async def invalidate_policy_cache(redis: aioredis.Redis) -> None:
    """Call after any policy mutation to force a fresh DB read on next inspection."""
    await redis.delete(_POLICY_CACHE_KEY)


def _deserialize_cached_policies(blob: str | bytes) -> list[Policy] | None:
    """
    Parse the Redis policy cache payload into Policy objects.
    Returns None if the payload is malformed — caller falls back to DB.
    """
    import json

    try:
        rows = json.loads(blob)
    except (ValueError, TypeError) as exc:
        logger.warning("policy_cache_decode_failed", error=str(exc))
        return None

    if not isinstance(rows, list):
        logger.warning("policy_cache_unexpected_shape", got=type(rows).__name__)
        return None

    policies: list[Policy] = []
    for row in rows:
        policy = _row_to_policy(row)
        if policy is None:
            logger.warning("policy_cache_row_invalid", row_keys=list(row.keys()) if isinstance(row, dict) else None)
            return None
        policies.append(policy)
    return policies


def _row_to_policy(row: object) -> Policy | None:
    if not isinstance(row, dict):
        return None
    if not _REQUIRED_POLICY_FIELDS.issubset(row.keys()):
        return None

    try:
        coerced = dict(row)
        coerced["id"] = uuid.UUID(coerced["id"]) if isinstance(coerced["id"], str) else coerced["id"]
        for ts_field in ("created_at", "updated_at"):
            if isinstance(coerced.get(ts_field), str):
                coerced[ts_field] = datetime.fromisoformat(coerced[ts_field])
        return Policy(**coerced)
    except (ValueError, TypeError) as exc:
        logger.warning("policy_cache_coerce_failed", error=str(exc))
        return None
