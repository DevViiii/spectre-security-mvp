from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ViolationDetail:
    policy_id: str
    policy_name: str
    rule_type: str
    action: str
    matched_pattern: str | None
    match_location: str | None


@dataclass(frozen=True)
class InspectionResult:
    """Returned by ShieldClient.inspect() for every LLM call."""
    allowed: bool
    action: str                        # "allow" | "alert" | "redact" | "block"
    text: str                          # Original or redacted text
    violations: list[ViolationDetail] = field(default_factory=list)
    inspection_ms: float = 0.0

    @property
    def was_redacted(self) -> bool:
        return self.action == "redact"

    @property
    def was_blocked(self) -> bool:
        return self.action == "block"

    @property
    def is_clean(self) -> bool:
        return len(self.violations) == 0
