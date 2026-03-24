"""
Magic link authentication router.

POST /auth/magic/request  — accepts email, sends magic link
GET  /auth/magic/verify   — validates token, returns session info
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth_magic.service import generate_magic_link, verify_magic_link
from app.auth_magic.email import send_magic_link_email
from app.config import settings
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.response import ok

router = APIRouter()


class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkVerifyRequest(BaseModel):
    token: str


@router.post("/request", summary="Request a magic link login email")
async def request_magic_link(
    payload: MagicLinkRequest,
    redis: aioredis.Redis = Depends(get_redis),
):
    """
    Accepts an email address and sends a magic link.
    Always returns 200 to prevent email enumeration.
    """
    base_url = settings.FRONTEND_URL.rstrip("/")

    magic_link = await generate_magic_link(
        email=str(payload.email),
        base_url=base_url,
        redis=redis,
    )

    await send_magic_link_email(
        to_email=str(payload.email),
        magic_link=magic_link,
    )

    return ok({
        "message": "If that email exists, a login link has been sent. Check your inbox.",
        "email": str(payload.email),
    })


@router.post("/verify", summary="Verify a magic link token")
async def verify_magic_link_token(
    payload: MagicLinkVerifyRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """
    Verifies a magic link token.
    On success: returns the API key for the session.
    On failure: returns 400 with error message.
    """
    try:
        api_key, is_new_user = await verify_magic_link(
            token=payload.token,
            redis=redis,
            db=db,
        )
        return ok({
            "api_key": api_key,
            "is_new_user": is_new_user,
            "message": "Welcome to Spectre Security!" if is_new_user else "Welcome back!",
        })
    except ValueError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(exc))
