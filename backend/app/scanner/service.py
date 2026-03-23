import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ScanNotFound
from app.scanner.models import Scan, ScanFinding
from app.scanner.schemas import ScanCreate


async def create_scan(db: AsyncSession, data: ScanCreate) -> Scan:
    scan = Scan(
        id=uuid.uuid4(),
        name=data.name,
        target_url=str(data.target_url),
        target_api_key_hint=data.target_api_key[:8] if data.target_api_key else None,
        target_api_key=data.target_api_key,
        attack_suite=data.attack_suite,
        status="pending",
    )
    db.add(scan)
    await db.flush()
    return scan


async def get_scan(db: AsyncSession, scan_id: uuid.UUID) -> Scan:
    result = await db.execute(
        select(Scan)
        .where(Scan.id == scan_id)
        .options(selectinload(Scan.findings))
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise ScanNotFound(f"Scan {scan_id} not found")
    return scan


async def list_scans(
    db: AsyncSession,
    *,
    limit: int = 20,
    cursor: str | None = None,
) -> tuple[list[Scan], int]:
    query = select(Scan).order_by(Scan.created_at.desc()).limit(limit)
    if cursor:
        query = query.where(Scan.id < uuid.UUID(cursor))

    result = await db.execute(query)
    scans = list(result.scalars().all())

    count_result = await db.execute(select(func.count(Scan.id)))
    total = count_result.scalar_one()

    return scans, total


async def mark_scan_running(db: AsyncSession, scan_id: uuid.UUID) -> None:
    scan = await get_scan(db, scan_id)
    scan.status = "running"
    scan.started_at = datetime.now(timezone.utc)


async def complete_scan(
    db: AsyncSession,
    scan_id: uuid.UUID,
    *,
    score: int,
    grade: str,
    total_attacks: int,
    failed_attacks: int,
) -> Scan:
    scan = await get_scan(db, scan_id)
    scan.status = "completed"
    scan.score = score
    scan.grade = grade
    scan.total_attacks = total_attacks
    scan.failed_attacks = failed_attacks
    scan.completed_at = datetime.now(timezone.utc)
    return scan


async def fail_scan(db: AsyncSession, scan_id: uuid.UUID, error_message: str) -> Scan:
    scan = await get_scan(db, scan_id)
    scan.status = "failed"
    scan.error_message = error_message
    scan.completed_at = datetime.now(timezone.utc)
    return scan


async def delete_scan(db: AsyncSession, scan_id: uuid.UUID) -> bool:
    scan = await db.get(Scan, scan_id)
    if not scan:
        return False
    await db.delete(scan)
    return True
