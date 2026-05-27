"""encrypt target_api_key in scans

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-15 00:00:00.000000

Widens scans.target_api_key to accommodate Fernet ciphertext, then encrypts
any existing plaintext values in place. The upgrade is idempotent — rows that
already contain valid ciphertext for the current SECRET_KEY are skipped, so
re-running the migration after a partial failure is safe.
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.core.crypto import encrypt, try_decrypt

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "scans",
        "target_api_key",
        existing_type=sa.String(500),
        type_=sa.String(1000),
        existing_nullable=True,
    )

    bind = op.get_bind()
    rows = bind.execute(
        sa.text("SELECT id, target_api_key FROM scans WHERE target_api_key IS NOT NULL")
    ).fetchall()

    encrypted = 0
    for row_id, value in rows:
        if try_decrypt(value) is not None:
            continue
        bind.execute(
            sa.text("UPDATE scans SET target_api_key = :v WHERE id = :id"),
            {"v": encrypt(value), "id": row_id},
        )
        encrypted += 1

    print(f"[migration 0004] encrypted {encrypted} of {len(rows)} target_api_key rows")


def downgrade() -> None:
    bind = op.get_bind()
    rows = bind.execute(
        sa.text("SELECT id, target_api_key FROM scans WHERE target_api_key IS NOT NULL")
    ).fetchall()

    for row_id, value in rows:
        plaintext = try_decrypt(value)
        if plaintext is None:
            continue
        bind.execute(
            sa.text("UPDATE scans SET target_api_key = :v WHERE id = :id"),
            {"v": plaintext, "id": row_id},
        )

    op.alter_column(
        "scans",
        "target_api_key",
        existing_type=sa.String(1000),
        type_=sa.String(500),
        existing_nullable=True,
    )
