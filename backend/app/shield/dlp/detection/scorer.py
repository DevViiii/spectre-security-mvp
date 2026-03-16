"""
Scoring engine for the Spectre Security detection system.

Converts a list of Findings into a 0–100 risk score and a
CLEAN / LOW / MEDIUM / HIGH / CRITICAL verdict.

Design:
  - Severity weights are the primary driver
  - Direction multipliers penalise secrets leaking in output more
  - Deduplication: same rule fires once regardless of match count
  - Score is capped at 100
"""
from __future__ import annotations

from app.shield.dlp.detection.base import Finding, Verdict


# Points assigned per severity level
SEVERITY_WEIGHTS: dict[str, int] = {
    "critical": 35,
    "high":     20,
    "medium":   10,
    "low":       3,
}

# Extra multiplier when a finding fires in the output direction
# Output findings are more severe: data actually left the system
DIRECTION_MULTIPLIERS: dict[str, float] = {
    # category → multiplier for output direction
    "secret":    1.5,
    "leak":      1.5,
    "injection": 1.0,   # injection in output = model was compromised
    "jailbreak": 1.2,
    "heuristic": 1.0,
}

# Score thresholds → verdict
VERDICT_THRESHOLDS: list[tuple[int, Verdict]] = [
    (80, "CRITICAL"),
    (50, "HIGH"),
    (25, "MEDIUM"),
    (1,  "LOW"),
    (0,  "CLEAN"),
]


def score_findings(findings: list[Finding]) -> tuple[int, Verdict]:
    """
    Converts a list of Findings into (score: int, verdict: Verdict).

    Algorithm:
    1. Deduplicate by rule_id — each rule contributes at most once
    2. For each unique finding, compute: weight × direction_multiplier × confidence
    3. Sum all contributions, round, cap at 100
    4. Map to verdict via threshold table
    """
    if not findings:
        return 0, "CLEAN"

    seen_rule_ids: set[str] = set()
    raw_score: float = 0.0

    for finding in findings:
        if finding.rule_id in seen_rule_ids:
            continue
        seen_rule_ids.add(finding.rule_id)

        weight = SEVERITY_WEIGHTS.get(finding.severity, 0)
        multiplier = DIRECTION_MULTIPLIERS.get(finding.category, 1.0)

        if finding.direction == "output":
            multiplier = DIRECTION_MULTIPLIERS.get(finding.category, 1.0)
        else:
            multiplier = 1.0

        raw_score += weight * multiplier * finding.confidence

    score = min(100, round(raw_score))
    verdict = _score_to_verdict(score)
    return score, verdict


def _score_to_verdict(score: int) -> Verdict:
    for threshold, verdict in VERDICT_THRESHOLDS:
        if score >= threshold:
            return verdict
    return "CLEAN"
