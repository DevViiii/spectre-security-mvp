"""
Integration tests for the scan and Shield API flows.
Uses the test client with an in-memory SQLite DB.
Does not make real HTTP calls to LLM endpoints.
"""
import pytest
from httpx import AsyncClient


# ── Health ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_liveness(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ── Auth ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_api_key(client: AsyncClient):
    response = await client.post("/auth", json={"name": "integration-test-key"})
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["key"].startswith("sk-spectre-")
    assert data["name"] == "integration-test-key"
    assert "key_prefix" in data


@pytest.mark.asyncio
async def test_list_api_keys_requires_auth(client: AsyncClient):
    response = await client.get("/auth")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_api_keys_with_valid_key(client: AsyncClient, api_key: str):
    response = await client.get("/auth", headers={"X-Api-Key": api_key})
    assert response.status_code == 200
    data = response.json()["data"]
    assert "keys" in data
    assert len(data["keys"]) >= 1


@pytest.mark.asyncio
async def test_revoke_api_key(client: AsyncClient, api_key: str):
    # Get key ID
    list_resp = await client.get("/auth", headers={"X-Api-Key": api_key})
    key_id = list_resp.json()["data"]["keys"][0]["id"]

    # Create a second key to use after revocation
    new_key_resp = await client.post("/auth", json={"name": "backup-key"})
    new_key = new_key_resp.json()["data"]["key"]

    # Revoke first key
    del_resp = await client.delete(f"/auth/{key_id}", headers={"X-Api-Key": new_key})
    assert del_resp.status_code == 204

    # Original key should now be rejected
    check = await client.get("/auth", headers={"X-Api-Key": api_key})
    assert check.status_code == 401


# ── Scanner ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_scan_requires_auth(client: AsyncClient):
    response = await client.post("/scans", json={
        "target_url": "https://api.example.com/chat",
        "attack_suite": "quick",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_scan_returns_pending(client: AsyncClient, api_key: str, monkeypatch):
    # Prevent Celery from actually dispatching
    monkeypatch.setattr(
        "app.worker.celery_app.celery_app.send_task",
        lambda *a, **kw: None,
    )
    response = await client.post(
        "/scans",
        json={"name": "test-scan", "target_url": "https://api.example.com/chat", "attack_suite": "quick"},
        headers={"X-Api-Key": api_key},
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["status"] == "pending"
    assert data["name"] == "test-scan"
    assert data["score"] is None


@pytest.mark.asyncio
async def test_get_scan_not_found(client: AsyncClient, api_key: str):
    response = await client.get(
        "/scans/00000000-0000-0000-0000-000000000000",
        headers={"X-Api-Key": api_key},
    )
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "scan_not_found"


@pytest.mark.asyncio
async def test_list_scans_empty(client: AsyncClient, api_key: str):
    response = await client.get("/scans", headers={"X-Api-Key": api_key})
    assert response.status_code == 200
    assert response.json()["data"]["scans"] == []


# ── Shield ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_inspect_clean_text(client: AsyncClient):
    """Shield /inspect should allow clean text with no violations."""
    response = await client.post("/shield/inspect", json={
        "text": "What is the weather in Calgary today?",
        "direction": "input",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["allowed"] is True
    assert data["violations"] == []


@pytest.mark.asyncio
async def test_create_and_trigger_policy(client: AsyncClient, api_key: str):
    """Create a regex policy then fire inspect with matching text."""
    # Create policy
    create_resp = await client.post(
        "/shield/policies",
        json={
            "name": "Block SSNs",
            "rule_type": "regex",
            "rule_config": {"pattern": r"\b\d{3}-\d{2}-\d{4}\b"},
            "action": "block",
            "applies_to": "both",
        },
        headers={"X-Api-Key": api_key},
    )
    assert create_resp.status_code == 201

    # Inspect text containing SSN
    inspect_resp = await client.post("/shield/inspect", json={
        "text": "My SSN is 123-45-6789 please keep it safe",
        "direction": "input",
    })
    data = inspect_resp.json()
    assert data["allowed"] is False
    assert data["action"] == "block"
    assert len(data["violations"]) >= 1


@pytest.mark.asyncio
async def test_redact_policy_modifies_text(client: AsyncClient, api_key: str):
    """A redact policy should return modified_text with matches replaced."""
    await client.post(
        "/shield/policies",
        json={
            "name": "Redact emails",
            "rule_type": "regex",
            "rule_config": {"pattern": r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"},
            "action": "redact",
            "applies_to": "output",
        },
        headers={"X-Api-Key": api_key},
    )
    inspect_resp = await client.post("/shield/inspect", json={
        "text": "Contact us at admin@example.com for help",
        "direction": "output",
    })
    data = inspect_resp.json()
    assert data["action"] == "redact"
    assert data["modified_text"] is not None
    assert "[REDACTED]" in data["modified_text"]
    assert "admin@example.com" not in data["modified_text"]


@pytest.mark.asyncio
async def test_list_violations(client: AsyncClient, api_key: str):
    """After a violation, it should appear in the violations log."""
    # Create and trigger a policy
    await client.post(
        "/shield/policies",
        json={
            "name": "Detect credit cards",
            "rule_type": "regex",
            "rule_config": {"pattern": r"\b4[0-9]{12}(?:[0-9]{3})?\b"},
            "action": "alert",
            "applies_to": "both",
        },
        headers={"X-Api-Key": api_key},
    )
    await client.post("/shield/inspect", json={
        "text": "Card number 4111111111111111 was used",
        "direction": "output",
    })

    violations_resp = await client.get("/shield/violations", headers={"X-Api-Key": api_key})
    assert violations_resp.status_code == 200
    data = violations_resp.json()["data"]
    assert data["total"] >= 1
