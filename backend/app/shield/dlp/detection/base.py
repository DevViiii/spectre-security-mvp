"""
Core data types for the Spectre Security detection engine.
All types are frozen dataclasses — immutable, hashable, serialisable.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

Category = Literal["secret", "injection", "leak", "jailbreak", "heuristic"]
Severity = Literal["critical", "high", "medium", "low"]
Verdict  = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "CLEAN"]
Direction = Literal["input", "output"]


@dataclass(frozen=True)
class Rule:
    """
    A single detection rule.
    Rules are data — they carry no execution logic.
    Matchers consume rules and decide how to apply them.
    """
    id: str
    category: Category
    severity: Severity
    name: str
    description: str
    # For regex rules: the pattern string
    # For keyword rules: the phrase to match (case-insensitive)
    pattern: str
    # Whether this rule applies to inputs, outputs, or both
    applies_to: Direction | Literal["both"] = "both"


@dataclass(frozen=True)
class Finding:
    """
    A single confirmed match produced by a Matcher.
    Immutable — created once, never mutated.
    """
    rule_id: str
    rule_name: str
    category: Category
    severity: Severity
    matched_text: str           # the actual text that triggered the rule (truncated to 200 chars)
    match_start: int            # character offset in the inspected text
    match_end: int
    direction: Direction
    confidence: float = 1.0     # 0.0–1.0; heuristics may produce < 1.0

    def to_dict(self) -> dict:
        return {
            "rule_id":      self.rule_id,
            "rule_name":    self.rule_name,
            "category":     self.category,
            "severity":     self.severity,
            "matched_text": self.matched_text,
            "match_start":  self.match_start,
            "match_end":    self.match_end,
            "direction":    self.direction,
            "confidence":   self.confidence,
        }


@dataclass
class DetectionResult:
    """
    The complete output of a DetectionEngine.run() call.
    Mutable during construction, then treated as read-only.
    """
    direction: Direction
    text_length: int
    score: int                          # 0–100 risk score
    verdict: Verdict                    # CLEAN | LOW | MEDIUM | HIGH | CRITICAL
    findings: list[Finding] = field(default_factory=list)
    inspection_ms: float = 0.0

    # Convenience groupings — populated by the engine after scoring
    secrets:    list[Finding] = field(default_factory=list)
    injections: list[Finding] = field(default_factory=list)
    leaks:      list[Finding] = field(default_factory=list)
    jailbreaks: list[Finding] = field(default_factory=list)
    heuristics: list[Finding] = field(default_factory=list)

    @property
    def is_clean(self) -> bool:
        return self.verdict == "CLEAN"

    @property
    def has_critical(self) -> bool:
        return any(f.severity == "critical" for f in self.findings)

    @property
    def finding_count(self) -> int:
        return len(self.findings)

    def to_dict(self) -> dict:
        return {
            "direction":     self.direction,
            "text_length":   self.text_length,
            "score":         self.score,
            "verdict":       self.verdict,
            "inspection_ms": self.inspection_ms,
            "finding_count": self.finding_count,
            "findings":      [f.to_dict() for f in self.findings],
        }
