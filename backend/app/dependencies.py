from typing import Annotated

from fastapi import Cookie, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis import get_redis
from app.core.exceptions import InvalidApiKey, AuthenticationError

SESSION_COOKIE_NAME = "spectre_api_key"


async def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


async def get_current_api_key(
    x_api_key: Annotated[str | None, Header()] = None,
    spectre_api_key: Annotated[str | None, Cookie()] = None,
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    Validates the caller's API key.
    Source precedence: X-Api-Key header (for SDK/API clients) → spectre_api_key
    cookie (for browser sessions). Cookie is httpOnly and set at login.
    """
    raw_key = x_api_key or spectre_api_key
    if not raw_key:
        raise InvalidApiKey("API key required (X-Api-Key header or session cookie)")

    # Circular import guard — auth service is imported here, not at module level
    from app.auth.service import verify_api_key
    key = await verify_api_key(db, raw_key)
    if not key:
        raise InvalidApiKey()
    return raw_key


# Type aliases for cleaner route signatures
DbSession = Annotated[AsyncSession, Depends(get_db)]
RedisClient = Annotated[aioredis.Redis, Depends(get_redis)]
ApiKey = Annotated[str, Depends(get_current_api_key)]
RequestID = Annotated[str, Depends(get_request_id)]
