import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


RuleType = Literal["regex", "ner", "keyword"]
Action = Literal["block", "redact", "alert"]
Direction = Literal["input", "output", "both"]


# ── Policy ─────────────────────────────────────────────────────────────────

class PolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    rule_type: RuleType
    rule_config: dict[str, Any] = Field(
        ...,
        description=(
            "For regex: {pattern: str}. "
            "For ner: {entity_types: list[str]}. "
            "For keyword: {terms: list[str], fuzzy_threshold: int}"
        ),
    )
    action: Action = "alert"
    applies_to: Direction = "both"


class PolicyUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    rule_config: dict[str, Any] | None = None
    action: Action | None = None
    applies_to: Direction | None = None
    is_active: bool | None = None


class PolicyResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    rule_type: str
    rule_config: dict[str, Any]
    action: str
    applies_to: str
    is_active: bool
    is_builtin: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PolicyListResponse(BaseModel):
    policies: list[PolicyResponse]
    total: int


# ── Inspect (hot path) ─────────────────────────────────────────────────────

class InspectRequest(BaseModel):
    text: str = Field(..., description="The text to inspect (prompt or response)")
    direction: Literal["input", "output"] = Field(
        "input", description="Whether this is a user prompt or model response"
    )
    context: dict[str, Any] | None = Field(
        None, description="Optional metadata (session_id, user_id, etc.)"
    )


class ViolationDetail(BaseModel):
    policy_id: uuid.UUID
    policy_name: str
    rule_type: str
    action: str
    matched_pattern: str | None
    match_location: str | None  # "input" or "output"


class InspectResponse(BaseModel):
    allowed: bool
    action: Action
    modified_text: str | None = Field(
        None, description="Redacted text if action=redact, else None"
    )
    violations: list[ViolationDetail] = []
    inspection_ms: float


# ── Violation ──────────────────────────────────────────────────────────────

class ViolationResponse(BaseModel):
    id: uuid.UUID
    policy_id: uuid.UUID
    policy_name: str | None = None
    direction: str
    action_taken: str
    matched_pattern: str | None
    context_excerpt: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ViolationListResponse(BaseModel):
    violations: list[ViolationResponse]
    total: int
    cursor: str | None = None
