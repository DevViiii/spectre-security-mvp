"""
Seed script — creates a default organization, admin user, and sample data
for development and pilot deployments.

Usage:
    docker compose exec api python scripts/seed_dev_data.py

Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING.
"""
import asyncio
import uuid

from sqlalchemy import text

from app.core.database import AsyncSessionLocal

DEFAULT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")


async def seed():
    async with AsyncSessionLocal() as db:
        print("Seeding default organization...")
        await db.execute(text("""
            INSERT INTO organizations (id, name, slug, plan, is_active)
            VALUES (:id, :name, :slug, :plan, true)
            ON CONFLICT (id) DO NOTHING
        """), {"id": str(DEFAULT_ORG_ID), "name": "Default Organization", "slug": "default", "plan": "pilot"})

        print("Seeding admin user...")
        await db.execute(text("""
            INSERT INTO users (id, org_id, email, name, role, is_active)
            VALUES (:id, :org_id, :email, :name, :role, true)
            ON CONFLICT (email) DO NOTHING
        """), {
            "id": str(DEFAULT_USER_ID),
            "org_id": str(DEFAULT_ORG_ID),
            "email": "admin@spectre.local",
            "name": "Admin",
            "role": "owner",
        })

        print("Seeding sample DLP policies...")
        policies = [
            {
                "id": str(uuid.uuid4()),
                "org_id": str(DEFAULT_ORG_ID),
                "name": "Block SSNs",
                "rule_type": "regex",
                "rule_config": '{"pattern": "\\\\b\\\\d{3}-\\\\d{2}-\\\\d{4}\\\\b"}',
                "action": "block",
                "applies_to": "both",
            },
            {
                "id": str(uuid.uuid4()),
                "org_id": str(DEFAULT_ORG_ID),
                "name": "Block credit cards",
                "rule_type": "regex",
                "rule_config": '{"pattern": "\\\\b4[0-9]{12}(?:[0-9]{3})?\\\\b"}',
                "action": "block",
                "applies_to": "both",
            },
            {
                "id": str(uuid.uuid4()),
                "org_id": str(DEFAULT_ORG_ID),
                "name": "Alert on email addresses",
                "rule_type": "regex",
                "rule_config": '{"pattern": "[a-zA-Z0-9._%+\\\\-]+@[a-zA-Z0-9.\\\\-]+\\\\.[a-zA-Z]{2,}"}',
                "action": "alert",
                "applies_to": "output",
            },
        ]

        for policy in policies:
            await db.execute(text("""
                INSERT INTO policies (id, org_id, name, rule_type, rule_config, action, applies_to, is_active, is_builtin)
                VALUES (:id, :org_id, :name, :rule_type, CAST(:rule_config AS jsonb), :action, :applies_to, true, true)
                ON CONFLICT (id) DO NOTHING
            """), policy)

        await db.commit()
        print("Seed complete.")
        print(f"  Default org ID: {DEFAULT_ORG_ID}")
        print(f"  Admin user: admin@spectre.local")
        print(f"  {len(policies)} sample policies created")


if __name__ == "__main__":
    asyncio.run(seed())
