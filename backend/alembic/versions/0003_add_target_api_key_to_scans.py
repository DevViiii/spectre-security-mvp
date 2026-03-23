"""add target_api_key to scans

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-23 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("scans", sa.Column("target_api_key", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("scans", "target_api_key")
