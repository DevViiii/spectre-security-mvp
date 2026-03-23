from typing import Literal

from fastapi import APIRouter, Query

from app.core.response import ok
from app.dependencies import ApiKey, RequestID
from app.shield.dlp.detection.rules import ALL_RULES, RULES_BY_ID
from app.shield.dlp.detection.base import Rule

router = APIRouter()

Category = Literal["secret", "injection", "leak", "jailbreak", "heuristic"]
Severity = Literal["critical", "high", "medium", "low"]


def _rule_to_dict(rule: Rule) -> dict:
    return {
        "id":          rule.id,
        "category":    rule.category,
        "severity":    rule.severity,
        "name":        rule.name,
        "description": rule.description,
        "applies_to":  rule.applies_to,
    }


@router.get("", summary="List all detection rules")
async def list_rules(
    _key: ApiKey,
    request_id: RequestID = None,
    category: Category | None = Query(None, description="Filter by category"),
    severity: Severity | None = Query(None, description="Filter by severity"),
    applies_to: Literal["input", "output", "both"] | None = Query(None),
):
    """
    Returns the full detection rule library.
    These are the 67 built-in rules the detection engine runs on every inspection.
    Filterable by category, severity, and direction.
    """
    rules = ALL_RULES

    if category:
        rules = [r for r in rules if r.category == category]
    if severity:
        rules = [r for r in rules if r.severity == severity]
    if applies_to:
        rules = [r for r in rules if r.applies_to == applies_to or r.applies_to == "both"]

    by_category: dict[str, list[dict]] = {}
    for rule in rules:
        by_category.setdefault(rule.category, []).append(_rule_to_dict(rule))

    return ok(
        {
            "total":       len(rules),
            "by_category": {k: len(v) for k, v in by_category.items()},
            "rules":       [_rule_to_dict(r) for r in rules],
        },
        request_id=request_id,
    )


@router.get("/summary", summary="Rule count summary by category and severity")
async def rules_summary(
    _key: ApiKey,
    request_id: RequestID = None,
):
    """
    Returns a compact summary of rule counts.
    Useful for dashboard widgets and pilot customer overview.
    """
    summary: dict[str, dict[str, int]] = {}
    for rule in ALL_RULES:
        summary.setdefault(rule.category, {})
        summary[rule.category].setdefault(rule.severity, 0)
        summary[rule.category][rule.severity] += 1

    return ok(
        {
            "total_rules": len(ALL_RULES),
            "categories":  summary,
        },
        request_id=request_id,
    )


@router.get("/{rule_id}", summary="Get a single rule by ID")
async def get_rule(
    rule_id: str,
    _key: ApiKey,
    request_id: RequestID = None,
):
    """Returns the full detail of a single detection rule by its ID."""
    from app.core.exceptions import NotFound
    rule = RULES_BY_ID.get(rule_id)
    if not rule:
        raise NotFound(f"Rule '{rule_id}' not found")
    return ok(_rule_to_dict(rule), request_id=request_id)
