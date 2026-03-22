import hashlib
import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.organizations.model import Organization
from app.organizations.user_model import User
from app.organizations.client_model import ApiClient
from app.organizations.schemas import OrganizationCreate, UserCreate, ApiClientCreate


# ── Organization ───────────────────────────────────────────────────────────

async def create_organization(db: AsyncSession, data: OrganizationCreate) -> Organization:
    org = Organization(
        id=uuid.uuid4(),
        name=data.name,
        slug=data.slug,
        plan=data.plan,
    )
    db.add(org)
    await db.flush()
    return org


async def get_organization(db: AsyncSession, org_id: uuid.UUID) -> Organization | None:
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    return result.scalar_one_or_none()


async def get_organization_by_slug(db: AsyncSession, slug: str) -> Organization | None:
    result = await db.execute(select(Organization).where(Organization.slug == slug))
    return result.scalar_one_or_none()


async def list_organizations(db: AsyncSession) -> list[Organization]:
    result = await db.execute(
        select(Organization).where(Organization.is_active == True).order_by(Organization.created_at.desc())
    )
    return list(result.scalars().all())


# ── User ───────────────────────────────────────────────────────────────────

async def create_user(db: AsyncSession, org_id: uuid.UUID, data: UserCreate) -> User:
    user = User(
        id=uuid.uuid4(),
        org_id=org_id,
        email=data.email,
        name=data.name,
        role=data.role,
    )
    db.add(user)
    await db.flush()
    return user


async def list_users(db: AsyncSession, org_id: uuid.UUID) -> list[User]:
    result = await db.execute(
        select(User).where(User.org_id == org_id, User.is_active == True)
    )
    return list(result.scalars().all())


# ── API Client ─────────────────────────────────────────────────────────────

def _generate_client_secret() -> str:
    return f"sc-{secrets.token_urlsafe(32)}"


def _hash_secret(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


async def create_api_client(
    db: AsyncSession, org_id: uuid.UUID, data: ApiClientCreate
) -> tuple[ApiClient, str]:
    raw_secret = _generate_client_secret()
    client = ApiClient(
        id=uuid.uuid4(),
        org_id=org_id,
        name=data.name,
        description=data.description,
        client_type=data.client_type,
        key_hash=_hash_secret(raw_secret),
        key_prefix=raw_secret[:12],
        scopes=data.scopes,
    )
    db.add(client)
    await db.flush()
    return client, raw_secret


async def list_api_clients(db: AsyncSession, org_id: uuid.UUID) -> list[ApiClient]:
    result = await db.execute(
        select(ApiClient)
        .where(ApiClient.org_id == org_id, ApiClient.is_active == True)
        .order_by(ApiClient.created_at.desc())
    )
    return list(result.scalars().all())


async def revoke_api_client(db: AsyncSession, client_id: uuid.UUID) -> bool:
    from sqlalchemy import update
    result = await db.execute(
        update(ApiClient)
        .where(ApiClient.id == client_id, ApiClient.is_active == True)
        .values(is_active=False)
        .returning(ApiClient.id)
    )
    return result.scalar_one_or_none() is not None
