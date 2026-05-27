"""
Browser session endpoints — set/clear the httpOnly auth cookie.

The cookie carries the raw API key. Browsers never see its value via JS
(httpOnly); the backend reads it from `Cookie:` headers on every request.
SDK/API clients continue to use `X-Api-Key` headers directly.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.service import verify_api_key
from app.config import settings
from app.core.database import get_db
from app.core.exceptions import InvalidApiKey
from app.core.response import ok, no_content
from app.dependencies import SESSION_COOKIE_NAME

router = APIRouter()

# 30 days
_SESSION_MAX_AGE = 60 * 60 * 24 * 30


class SessionCreate(BaseModel):
    api_key: str


def set_session_cookie(response: Response, raw_key: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=raw_key,
        max_age=_SESSION_MAX_AGE,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )


@router.post("", summary="Open a browser session with an API key")
async def create_session(
    body: SessionCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Validates the API key and sets an httpOnly session cookie. Used by the
    dashboard login form when a user pastes their API key.
    """
    key = await verify_api_key(db, body.api_key)
    if not key:
        raise InvalidApiKey()
    set_session_cookie(response, body.api_key)
    return ok({"ok": True})


@router.delete("", status_code=204, summary="Close the browser session")
async def delete_session(response: Response):
    """Logs out by clearing the session cookie. Always succeeds."""
    clear_session_cookie(response)
    return no_content()
