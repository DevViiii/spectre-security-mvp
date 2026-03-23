import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import PolicyNotFound
from app.shield.models import Policy, Violation
from app.shield.schemas import PolicyCreate, PolicyUpdate


# ── Policy CRUD ────────────────────────────────────────────────────────────

async def create_policy(db: AsyncSession, data: PolicyCreate) -> Policy:
    policy = Policy(
        id=uuid.uuid4(),
        name=data.name,
        description=data.description,
        rule_type=data.rule_type,
        rule_config=data.rule_config,
        action=data.action,
        applies_to=data.applies_to,
        is_active=True,
        is_builtin=False,
    )
    db.add(policy)
    await db.flush()
    return policy


async def get_policy(db: AsyncSession, policy_id: uuid.UUID) -> Policy:
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise PolicyNotFound(f"Policy {policy_id} not found")
    return policy


async def list_policies(db: AsyncSession, *, active_only: bool = False) -> list[Policy]:
    query = select(Policy).order_by(Policy.created_at.desc())
    if active_only:
        query = query.where(Policy.is_active == True)
    result = await db.execute(query)
    return list(result.scalars().all())


async def list_active_policies(db: AsyncSession) -> list[Policy]:
    return await list_policies(db, active_only=True)


async def update_policy(db: AsyncSession, policy_id: uuid.UUID, data: PolicyUpdate) -> Policy:
    policy = await get_policy(db, policy_id)
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(policy, field, value)
    policy.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return policy


async def delete_policy(db: AsyncSession, policy_id: uuid.UUID) -> bool:
    policy = await db.get(Policy, policy_id)
    if not policy:
        return False
    if policy.is_builtin:
        raise ValueError("Built-in policies cannot be deleted")
    await db.delete(policy)
    return True


# ── Violation writes ───────────────────────────────────────────────────────

async def log_violation(
    db: AsyncSession,
    *,
    policy_id: uuid.UUID,
    direction: str,
    action_taken: str,
    matched_pattern: str | None,
    context_excerpt: str | None,
    metadata: dict | None = None,
) -> Violation:
    violation = Violation(
        id=uuid.uuid4(),
        policy_id=policy_id,
        direction=direction,
        action_taken=action_taken,
        matched_pattern=matched_pattern,
        context_excerpt=(context_excerpt or "")[:500],
        metadata_=metadata,
    )
    db.add(violation)
    await db.flush()
    return violation


async def list_violations(
    db: AsyncSession,
    *,
    policy_id: uuid.UUID | None = None,
    limit: int = 50,
    offset: int = 0,
    cursor: str | None = None,
) -> tuple[list[Violation], int]:
    query = select(Violation).order_by(Violation.created_at.desc()).limit(limit)
    if policy_id:
        query = query.where(Violation.policy_id == policy_id)
    if cursor:
        query = query.where(Violation.id < uuid.UUID(cursor))
    elif offset:
        query = query.offset(offset)

    result = await db.execute(query)
    violations = list(result.scalars().all())

    count_query = select(func.count(Violation.id))
    if policy_id:
        count_query = count_query.where(Violation.policy_id == policy_id)
    total = (await db.execute(count_query)).scalar_one()

    return violations, total
