"""
Magic link authentication for Spectre Security.

Flow:
  1. User submits email → generate_magic_link() creates a token, stores in Redis,
     sends email via Resend
  2. User clicks link → verify_magic_link() validates token, creates org + user +
     API key if new, sets session cookie, returns API key for dashboard

Token format: spectre_ml_{32 random bytes hex}
TTL: 15 minutes (configurable)
One-time use: token deleted immediately on verification
"""
from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime

import redis.asyncio as aioredis
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.auth.models import ApiKey
from app.auth.service import create_key
from app.auth.schemas import ApiKeyCreate
from app.organizations.model import Organization
from app.organizations.user_model import User
from app.organizations.service import create_organization, create_user
from app.organizations.schemas import OrganizationCreate, UserCreate

logger = structlog.get_logger(__name__)

MAGIC_LINK_PREFIX = "spectre:magic:"
MAGIC_LINK_TTL = 900  # 15 minutes


def _generate_token() -> str:
    return f"spectre_ml_{secrets.token_hex(32)}"


def _token_key(token: str) -> str:
    # Store hashed token in Redis — never store raw token
    hashed = hashlib.sha256(token.encode()).hexdigest()
    return f"{MAGIC_LINK_PREFIX}{hashed}"


async def generate_magic_link(
    email: str,
    base_url: str,
    redis: aioredis.Redis,
) -> str:
    """
    Creates a magic link token for the given email.
    Stores email → token in Redis with TTL.
    Returns the full magic link URL.
    """
    email = email.lower().strip()
    token = _generate_token()
    key = _token_key(token)

    # Store email against this token
    await redis.setex(key, MAGIC_LINK_TTL, email)

    magic_link = f"{base_url}/verify?token={token}"
    logger.info("magic_link_generated", email=email, ttl=MAGIC_LINK_TTL)
    return magic_link


async def verify_magic_link(
    token: str,
    redis: aioredis.Redis,
    db: AsyncSession,
) -> tuple[str, bool]:
    """
    Verifies a magic link token.

    Returns:
        (api_key, is_new_user) — the raw API key to set as cookie,
        and whether this is a first-time signup

    Raises:
        ValueError if token is invalid or expired
    """
    key = _token_key(token)
    email_bytes = await redis.get(key)

    if not email_bytes:
        raise ValueError("Magic link is invalid or has expired. Please request a new one.")

    # One-time use — delete immediately
    await redis.delete(key)

    email = email_bytes if isinstance(email_bytes, str) else email_bytes.decode()
    email = email.lower().strip()

    # Check if user already exists
    result = await db.execute(
        select(User).where(User.email == email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # Returning user — get their org's most recent active API key
        org_id = existing_user.org_id
        result = await db.execute(
            select(ApiKey)
            .where(ApiKey.org_id == org_id, ApiKey.is_active == True)
            .order_by(ApiKey.created_at.desc())
            .limit(1)
        )
        existing_key = result.scalar_one_or_none()

        if existing_key:
            # We can't return the raw key (it's hashed) — create a new session key
            new_key_obj, raw_key = await _create_session_key(db, org_id, existing_user.id, email)
            await db.commit()
            logger.info("magic_link_verified_returning", email=email)
            return raw_key, False

        # No active key — create one
        new_key_obj, raw_key = await _create_session_key(db, org_id, existing_user.id, email)
        await db.commit()
        return raw_key, False

    # New user — create org, user, and API key
    org = await create_organization(db, OrganizationCreate(
        name=f"{email.split('@')[0].title()}'s Organization",
        slug=_email_to_slug(email),
        plan="pilot",
    ))

    user = await create_user(db, org.id, UserCreate(
        email=email,
        name=email.split("@")[0].title(),
        role="owner",
    ))

    key_obj, raw_key = await _create_session_key(db, org.id, user.id, email)
    await db.commit()

    logger.info("magic_link_verified_new_user", email=email, org_id=str(org.id))

    # Notify admin of new signup (fire and forget)
    from app.auth_magic.email import send_admin_signup_notification
    try:
        await send_admin_signup_notification(email=email, org_slug=org.slug)
    except Exception:
        pass  # Never block signup on notification failure

    return raw_key, True


async def _create_session_key(
    db: AsyncSession,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    email: str,
) -> tuple[ApiKey, str]:
    """Creates a named API key for a user session."""
    key_obj, raw_key = await create_key(db, ApiKeyCreate(
        name=f"Session — {email}"
    ))
    # Link key to org and user
    from sqlalchemy import update
    await db.execute(
        update(ApiKey)
        .where(ApiKey.id == key_obj.id)
        .values(org_id=org_id, user_id=user_id)
    )
    return key_obj, raw_key


def _email_to_slug(email: str) -> str:
    """Converts email to a unique org slug."""
    base = email.split("@")[0].lower()
    # Remove non-alphanumeric except hyphens
    clean = "".join(c if c.isalnum() else "-" for c in base)
    clean = clean.strip("-")[:40]
    # Add random suffix to ensure uniqueness
    suffix = secrets.token_hex(3)
    return f"{clean}-{suffix}"
