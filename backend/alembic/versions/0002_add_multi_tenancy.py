"""add multi-tenancy schema

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-17 00:00:00.000000

Strategy:
  1. Add organizations, users, api_clients, reports tables
  2. Add nullable org_id columns to existing tables
  3. Create a default "default" organization for existing data
  4. Backfill org_id on all existing rows
  5. Add indexes
  6. Do NOT add NOT NULL constraint yet — allows gradual migration
     (add NOT NULL in migration 0003 after backfill is verified)
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# The default org ID used to backfill existing rows
DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001"


def upgrade() -> None:
    # ── 1. organizations ───────────────────────────────────────────────
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("plan", sa.String(50), nullable=False, server_default="pilot"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"], unique=True)

    # ── 2. users ───────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=True),
        sa.Column("role", sa.String(20), nullable=False, server_default="member"),
        sa.Column("password_hash", sa.String(128), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_org_id", "users", ["org_id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── 3. api_clients ─────────────────────────────────────────────────
    op.create_table(
        "api_clients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("client_type", sa.String(20), nullable=False, server_default="sdk"),
        sa.Column("key_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("key_prefix", sa.String(12), nullable=False),
        sa.Column("scopes", sa.String(500), nullable=False, server_default="shield:inspect"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_api_clients_org_id", "api_clients", ["org_id"])

    # ── 4. reports ─────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scan_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("scans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("org_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("s3_key", sa.String(500), nullable=True),
        sa.Column("signed_url", sa.Text(), nullable=True),
        sa.Column("signed_url_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("file_size_bytes", sa.Integer(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(20), nullable=False, server_default="generating"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_reports_scan_id", "reports", ["scan_id"])
    op.create_index("ix_reports_org_id", "reports", ["org_id"])

    # ── 5. Seed default organization ───────────────────────────────────
    op.execute(f"""
        INSERT INTO organizations (id, name, slug, plan, is_active)
        VALUES (
            '{DEFAULT_ORG_ID}',
            'Default Organization',
            'default',
            'pilot',
            true
        )
        ON CONFLICT (id) DO NOTHING
    """)

    # ── 6. Add nullable org_id to existing tables ──────────────────────
    for table in ["api_keys", "scans", "policies", "violations", "audit_log"]:
        op.add_column(table, sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="SET NULL"),
            nullable=True,
        ))
        op.create_index(f"ix_{table}_org_id", table, ["org_id"])

    # ── 7. Backfill org_id on all existing rows ────────────────────────
    for table in ["api_keys", "scans", "policies", "violations", "audit_log"]:
        op.execute(f"""
            UPDATE {table}
            SET org_id = '{DEFAULT_ORG_ID}'
            WHERE org_id IS NULL
        """)

    # ── 8. Add created_by to scans ─────────────────────────────────────
    op.add_column("scans", sa.Column(
        "created_by",
        postgresql.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    ))

    # ── 9. Add user_id to api_keys ─────────────────────────────────────
    op.add_column("api_keys", sa.Column(
        "user_id",
        postgresql.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    ))


def downgrade() -> None:
    # Remove added columns from existing tables
    op.drop_column("api_keys", "user_id")
    op.drop_column("scans", "created_by")

    for table in ["api_keys", "scans", "policies", "violations", "audit_log"]:
        op.drop_index(f"ix_{table}_org_id", table_name=table)
        op.drop_column(table, "org_id")

    op.drop_table("reports")
    op.drop_table("api_clients")
    op.drop_table("users")
    op.drop_table("organizations")
