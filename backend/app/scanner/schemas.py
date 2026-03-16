import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


AttackSuite = Literal["full", "quick", "injection_only", "jailbreak_only"]
ScanStatus = Literal["pending", "running", "completed", "failed"]
Severity = Literal["critical", "high", "medium", "low"]
FindingStatus = Literal["passed", "failed", "error"]


class ScanCreate(BaseModel):
    name: str | None = Field(None, max_length=200)
    target_url: str = Field(..., description="The LLM endpoint URL to scan")
    target_api_key: str | None = Field(None, description="Bearer token for the target endpoint")
    attack_suite: AttackSuite = Field("full", description="Which attack suite to run")


class ScanResponse(BaseModel):
    id: uuid.UUID
    name: str | None
    target_url: str
    attack_suite: str
    status: ScanStatus
    score: int | None
    grade: str | None
    total_attacks: int | None
    failed_attacks: int | None
    report_url: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    error_message: str | None

    model_config = {"from_attributes": True}


class FindingResponse(BaseModel):
    id: uuid.UUID
    attack_id: str
    category: str
    severity: Severity
    status: FindingStatus
    payload: str | None
    response_excerpt: str | None
    classifier_used: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ScanDetailResponse(ScanResponse):
    findings: list[FindingResponse] = []


class ScanListResponse(BaseModel):
    scans: list[ScanResponse]
    total: int
    cursor: str | None = None
