"""
Scan task — core attack execution loop.

Flow:
  1. Mark scan as running
  2. Load attack definitions for the requested suite
  3. Fire each attack at the target endpoint (HTTP POST)
  4. Classify each response
  5. Persist ScanFinding for every attack
  6. Score all findings
  7. Mark scan as completed (or failed)
  8. Trigger report generation
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

import httpx
import structlog

from app.worker.celery_app import celery_app

logger = structlog.get_logger(__name__)

# How long to wait for the target LLM endpoint per request (seconds)
TARGET_REQUEST_TIMEOUT = 30


@celery_app.task(
    name="worker.tasks.scan_tasks.run_scan",
    bind=True,
    max_retries=1,
    default_retry_delay=10,
)
def run_scan(self, scan_id: str) -> dict:
    """
    Celery task entry point — synchronous wrapper around the async implementation.
    Celery workers run in a standard thread pool; we create a new event loop per task.
    """
    try:
        return asyncio.run(_run_scan_async(scan_id))
    except Exception as exc:
        logger.error("scan_task_unhandled_error", scan_id=scan_id, error=str(exc))
        asyncio.run(_fail_scan(scan_id, str(exc)))
        raise self.retry(exc=exc)


async def _run_scan_async(scan_id: str) -> dict:
    from app.core.database import AsyncSessionLocal
    from app.scanner import service as scan_service
    from app.scanner.attacks.loader import load_attacks
    from app.scanner.classifiers import classify_response
    from app.scanner.models import ScanFinding
    from app.scanner.scorer import compute_score, FindingInput

    scan_uuid = uuid.UUID(scan_id)
    log = logger.bind(scan_id=scan_id)

    async with AsyncSessionLocal() as db:
        # ── 1. Mark as running ─────────────────────────────────────────
        scan = await scan_service.get_scan(db, scan_uuid)
        await scan_service.mark_scan_running(db, scan_uuid)
        await db.commit()
        log.info("scan_started", target=scan.target_url, suite=scan.attack_suite)

        # ── 2. Load attack definitions ─────────────────────────────────
        attacks = load_attacks(suite=scan.attack_suite)
        log.info("attacks_loaded", count=len(attacks))

        # ── 3 & 4. Fire attacks and classify responses ─────────────────
        findings_data: list[dict] = []

        async with httpx.AsyncClient(timeout=TARGET_REQUEST_TIMEOUT) as client:
            for attack in attacks:
                finding = await _execute_attack(
                    client=client,
                    attack=attack,
                    target_url=scan.target_url,
                    scan_id=scan_uuid,
                )
                findings_data.append(finding)

        # ── 5. Persist findings ────────────────────────────────────────
        async with AsyncSessionLocal() as db:
            for f in findings_data:
                db.add(ScanFinding(
                    id=uuid.uuid4(),
                    scan_id=scan_uuid,
                    attack_id=f["attack_id"],
                    category=f["category"],
                    severity=f["severity"],
                    status=f["status"],
                    payload=f["payload"][:2000] if f["payload"] else None,
                    response_excerpt=f["response_excerpt"],
                    classifier_used=f["classifier_used"],
                ))
            await db.commit()

        # ── 6. Score ───────────────────────────────────────────────────
        scoring_inputs = [
            FindingInput(severity=f["severity"], status=f["status"])
            for f in findings_data
        ]
        result = compute_score(scoring_inputs)
        log.info(
            "scan_scored",
            score=result.score,
            grade=result.grade,
            failed=result.failed_attacks,
            total=result.total_attacks,
        )

        # ── 7. Mark completed ──────────────────────────────────────────
        async with AsyncSessionLocal() as db:
            await scan_service.complete_scan(
                db,
                scan_uuid,
                score=result.score,
                grade=result.grade,
                total_attacks=result.total_attacks,
                failed_attacks=result.failed_attacks,
            )
            await db.commit()

        # ── 8. Auto-generate report ────────────────────────────────────
        celery_app.send_task(
            "worker.tasks.report_tasks.generate_report",
            args=[scan_id],
        )

        return {
            "scan_id": scan_id,
            "score": result.score,
            "grade": result.grade,
            "total": result.total_attacks,
            "failed": result.failed_attacks,
        }


async def _execute_attack(
    client: httpx.AsyncClient,
    attack,
    target_url: str,
    scan_id: uuid.UUID,
) -> dict:
    """Fires a single attack at the target and classifies the response."""
    from app.scanner.classifiers import classify_response

    base = {
        "attack_id": attack.id,
        "category": attack.category,
        "severity": attack.severity,
        "payload": attack.payload,
        "response_excerpt": None,
        "classifier_used": None,
        "status": "error",
    }

    try:
        # Standard OpenAI-compatible chat completions endpoint
        response = await client.post(
            target_url,
            json={
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": attack.payload}],
                "max_tokens": 500,
            },
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
        data = response.json()
        model_reply = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )

        classification = classify_response(
            payload=attack.payload,
            response=model_reply,
            classifier_configs=attack.classifiers,
            severity=attack.severity,
        )

        base.update({
            "response_excerpt": model_reply[:500],
            "classifier_used": classification.classifier,
            "status": "passed" if classification.passed else "failed",
        })

    except httpx.TimeoutException:
        base["status"] = "error"
        base["response_excerpt"] = "Request timed out"
    except httpx.HTTPStatusError as exc:
        base["status"] = "error"
        base["response_excerpt"] = f"HTTP {exc.response.status_code}"
    except Exception as exc:
        base["status"] = "error"
        base["response_excerpt"] = f"Error: {str(exc)[:200]}"
        logger.warning("attack_execution_error", attack_id=attack.id, error=str(exc))

    return base


async def _fail_scan(scan_id: str, error_message: str) -> None:
    """Called if the task itself crashes — marks the scan record as failed."""
    try:
        from app.core.database import AsyncSessionLocal
        from app.scanner import service as scan_service
        async with AsyncSessionLocal() as db:
            await scan_service.fail_scan(db, uuid.UUID(scan_id), error_message)
            await db.commit()
    except Exception as exc:
        logger.error("fail_scan_error", scan_id=scan_id, error=str(exc))
