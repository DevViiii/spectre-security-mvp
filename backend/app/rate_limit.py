"""
Rate limiting for Spectre Security API.

Uses slowapi (Starlette-compatible wrapper around limits).
Limits are per-IP by default.

Endpoint-specific limits:
  - POST /scans          10/minute   (scan creation is expensive)
  - POST /auth           5/minute    (key creation — prevent enumeration)
  - POST /shield/inspect 300/minute  (SDK hot path — generous but capped)
  - Default              100/minute  (all other endpoints)

In production, use Redis as the storage backend so limits
are shared across multiple API instances.
"""
from __future__ import annotations

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings


def _get_key(request) -> str:
    """
    Rate limit key function.
    Uses X-Forwarded-For if behind a proxy (EC2 + Nginx setup),
    falls back to direct remote address.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return get_remote_address(request)


# Module-level limiter — imported by routers
limiter = Limiter(
    key_func=_get_key,
    default_limits=[settings.RATE_LIMIT_DEFAULT],
    enabled=settings.RATE_LIMIT_ENABLED,
    # In production use Redis storage:
    # storage_uri=settings.REDIS_URL,
)

__all__ = ["limiter", "RateLimitExceeded", "_rate_limit_exceeded_handler"]
