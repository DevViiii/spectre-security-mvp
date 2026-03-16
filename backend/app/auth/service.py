import hashlib
import secrets
import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import ApiKey


def _generate_raw_key() -> str:
    """Generates a cryptographically random API key with a recognisable prefix."""
    token = secrets.token_urlsafe(32)
    return f"sk-spectre-{token}"


def _hash_key(raw_key: str) -> str:
    """SHA-256 hash of the raw key — stored in the database."""
    return hashlib.sha256(raw_key.encode()).hexdigest()


async def create_api_key(db: AsyncSession, name: str) -> tuple[ApiKey, str]:
    """
    Creates a new API key record.
    Returns (ApiKey ORM object, raw_key_string).
    The raw key is returned exactly once and never stored.
    """
    raw_key = _generate_raw_key()
    key_hash = _hash_key(raw_key)

    api_key = ApiKey(
        id=uuid.uuid4(),
        name=name,
        key_hash=key_hash,
        key_prefix=raw_key[:12],
    )
    db.add(api_key)
    await db.flush()
    return api_key, raw_key


async def verify_api_key(db: AsyncSession, raw_key: str) -> ApiKey | None:
    """
    Validates a raw key against stored hashes.
    Updates last_used_at on success.
    Returns None if invalid or revoked.
    """
    key_hash = _hash_key(raw_key)

    result = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)
    )
    api_key = result.scalar_one_or_none()

    if api_key:
        from datetime import datetime, timezone
        await db.execute(
            update(ApiKey)
            .where(ApiKey.id == api_key.id)
            .values(last_used_at=datetime.now(timezone.utc))
        )

    return api_key


async def revoke_api_key(db: AsyncSession, key_id: uuid.UUID) -> bool:
    """Soft-deletes an API key. Returns True if the key existed and was deactivated."""
    result = await db.execute(
        update(ApiKey)
        .where(ApiKey.id == key_id, ApiKey.is_active == True)
        .values(is_active=False)
        .returning(ApiKey.id)
    )
    return result.scalar_one_or_none() is not None


async def list_api_keys(db: AsyncSession) -> list[ApiKey]:
    result = await db.execute(
        select(ApiKey).where(ApiKey.is_active == True).order_by(ApiKey.created_at.desc())
    )
    return list(result.scalars().all())
