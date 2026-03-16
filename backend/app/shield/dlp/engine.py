"""
DLP inspection engine.
Orchestrates the 3-layer pipeline: regex → NER → keyword blocklist.
This is the hot path — every LLM call goes through here.
Target latency: <30ms p95.
"""
from __future__ import annotations

import re
import time
import uuid
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from app.shield.dlp.blocklist import detect_keywords
from app.shield.dlp.ner import NERDetector
from app.shield.dlp.patterns import BUILTIN_PATTERNS, get_pattern

if TYPE_CHECKING:
    from app.shield.models import Policy


@dataclass(frozen=True)
class PolicyMatch:
    policy_id: uuid.UUID
    policy_name: str
    rule_type: str
    action: str           # block | redact | alert
    matched_pattern: str | None
    matched_text: str | None


@dataclass
class InspectionResult:
    allowed: bool
    action: str           # the highest-severity action taken (block > redact > alert)
    modified_text: str | None
    matches: list[PolicyMatch] = field(default_factory=list)
    inspection_ms: float = 0.0


_ACTION_PRIORITY = {"block": 3, "redact": 2, "alert": 1}


def inspect(
    text: str,
    direction: str,
    policies: list["Policy"],
) -> InspectionResult:
    """
    Runs the 3-layer DLP pipeline against the given text.

    Layer 1 — Regex: built-in patterns + custom regex policies
    Layer 2 — NER: spaCy entity detection (if model available)
    Layer 3 — Keyword blocklist: customer-defined terms

    Returns an InspectionResult describing what was found and what action to take.
    """
    start = time.perf_counter()
    matches: list[PolicyMatch] = []

    for policy in policies:
        if not policy.is_active:
            continue
        if policy.applies_to not in (direction, "both"):
            continue

        found = _run_policy(text, policy)
        if found:
            matches.extend(found)

    # Determine the highest-priority action across all matches
    if not matches:
        elapsed_ms = (time.perf_counter() - start) * 1000
        return InspectionResult(
            allowed=True,
            action="allow",
            modified_text=None,
            matches=[],
            inspection_ms=round(elapsed_ms, 2),
        )

    top_action = max(matches, key=lambda m: _ACTION_PRIORITY.get(m.action, 0)).action
    modified_text: str | None = None

    if top_action == "redact":
        modified_text = _redact(text, matches)
    
    elapsed_ms = (time.perf_counter() - start) * 1000
    return InspectionResult(
        allowed=top_action not in ("block",),
        action=top_action,
        modified_text=modified_text,
        matches=matches,
        inspection_ms=round(elapsed_ms, 2),
    )


def _run_policy(text: str, policy: "Policy") -> list[PolicyMatch]:
    """Dispatches to the correct detection method based on policy rule_type."""
    config = policy.rule_config

    if policy.rule_type == "regex":
        return _run_regex_policy(text, policy, config)
    elif policy.rule_type == "ner":
        return _run_ner_policy(text, policy, config)
    elif policy.rule_type == "keyword":
        return _run_keyword_policy(text, policy, config)

    return []


def _run_regex_policy(text: str, policy: "Policy", config: dict) -> list[PolicyMatch]:
    pattern_str = config.get("pattern", "")
    if not pattern_str:
        return []
    try:
        compiled = re.compile(pattern_str, re.IGNORECASE)
        match = compiled.search(text)
        if match:
            return [PolicyMatch(
                policy_id=policy.id,
                policy_name=policy.name,
                rule_type="regex",
                action=policy.action,
                matched_pattern=pattern_str,
                matched_text=match.group()[:100],
            )]
    except re.error:
        pass
    return []


def _run_ner_policy(text: str, policy: "Policy", config: dict) -> list[PolicyMatch]:
    entity_types = set(config.get("entity_types", ["PERSON", "ORG"]))
    detector = NERDetector.get()
    if not detector.available:
        return []
    hits = detector.detect(text, entity_types=entity_types)
    return [
        PolicyMatch(
            policy_id=policy.id,
            policy_name=policy.name,
            rule_type="ner",
            action=policy.action,
            matched_pattern=hit.label,
            matched_text=hit.text[:100],
        )
        for hit in hits[:5]  # cap at 5 matches per NER policy to control response size
    ]


def _run_keyword_policy(text: str, policy: "Policy", config: dict) -> list[PolicyMatch]:
    terms = config.get("terms", [])
    fuzzy_threshold = config.get("fuzzy_threshold", 85) / 100.0
    use_fuzzy = config.get("use_fuzzy", False)

    hits = detect_keywords(text, terms, fuzzy_threshold=fuzzy_threshold, use_fuzzy=use_fuzzy)
    return [
        PolicyMatch(
            policy_id=policy.id,
            policy_name=policy.name,
            rule_type="keyword",
            action=policy.action,
            matched_pattern=hit.term,
            matched_text=hit.matched_text[:100],
        )
        for hit in hits
    ]


def _redact(text: str, matches: list[PolicyMatch]) -> str:
    """
    Replaces matched text spans with [REDACTED].
    Simple substring replacement — good enough for v1.
    """
    result = text
    for match in matches:
        if match.matched_text:
            result = result.replace(match.matched_text, "[REDACTED]")
    return result


def inspect_with_builtin_patterns(
    text: str,
    direction: str,
) -> list[PolicyMatch]:
    """
    Runs the built-in regex patterns (no DB required).
    Used as a fast fallback when no active policies are configured yet.
    """
    matches: list[PolicyMatch] = []
    for bp in BUILTIN_PATTERNS:
        compiled = get_pattern(bp.id)
        if compiled and compiled.search(text):
            matches.append(PolicyMatch(
                policy_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                policy_name=bp.name,
                rule_type="regex",
                action="alert",
                matched_pattern=bp.pattern,
                matched_text=None,
            ))
    return matches
