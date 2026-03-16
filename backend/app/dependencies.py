from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis import get_redis
from app.core.exceptions import InvalidApiKey, AuthenticationError


async def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


async def get_current_api_key(
    x_api_key: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    Validates the X-Api-Key header against the database.
    Returns the raw key string if valid.
    Raises InvalidApiKey if missing or revoked.
    """
    if not x_api_key:
        raise InvalidApiKey("X-Api-Key header is required")

    # Circular import guard — auth service is imported here, not at module level
    from app.auth.service import verify_api_key
    key = await verify_api_key(db, x_api_key)
    if not key:
        raise InvalidApiKey()
    return x_api_key


# Type aliases for cleaner route signatures
DbSession = Annotated[AsyncSession, Depends(get_db)]
RedisClient = Annotated[aioredis.Redis, Depends(get_redis)]
ApiKey = Annotated[str, Depends(get_current_api_key)]
RequestID = Annotated[str, Depends(get_request_id)]
