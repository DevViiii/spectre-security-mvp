"""
Built-in DLP regex patterns.
Each pattern is a dict with: name, pattern (str), severity, description.
"""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class BuiltinPattern:
    id: str
    name: str
    pattern: str
    severity: str  # critical | high | medium | low
    description: str
    category: str  # pii | credentials | financial


BUILTIN_PATTERNS: list[BuiltinPattern] = [
    # ── Credentials ────────────────────────────────────────────────────
    BuiltinPattern(
        id="cred_openai_key",
        name="OpenAI API key",
        pattern=r"sk-[A-Za-z0-9]{20,}",
        severity="critical",
        description="OpenAI API key (sk-...)",
        category="credentials",
    ),
    BuiltinPattern(
        id="cred_anthropic_key",
        name="Anthropic API key",
        pattern=r"sk-ant-[A-Za-z0-9\-]{20,}",
        severity="critical",
        description="Anthropic API key (sk-ant-...)",
        category="credentials",
    ),
    BuiltinPattern(
        id="cred_aws_access_key",
        name="AWS access key ID",
        pattern=r"(?<![A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])",
        severity="critical",
        description="AWS access key ID (20-char uppercase alphanumeric)",
        category="credentials",
    ),
    BuiltinPattern(
        id="cred_aws_secret",
        name="AWS secret access key",
        pattern=r"(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])",
        severity="critical",
        description="AWS secret access key (40-char base64-like string)",
        category="credentials",
    ),
    BuiltinPattern(
        id="cred_github_token",
        name="GitHub personal access token",
        pattern=r"ghp_[A-Za-z0-9]{36}",
        severity="critical",
        description="GitHub personal access token (ghp_...)",
        category="credentials",
    ),
    BuiltinPattern(
        id="cred_bearer_token",
        name="Bearer token",
        pattern=r"Bearer\s+[A-Za-z0-9\-._~+/]+=*",
        severity="high",
        description="HTTP Authorization Bearer token",
        category="credentials",
    ),
    BuiltinPattern(
        id="cred_generic_secret",
        name="Generic secret/password assignment",
        pattern=r'(?i)(password|passwd|secret|api_key|apikey|token)\s*[=:]\s*["\']?[A-Za-z0-9!@#$%^&*()_+\-=]{8,}["\']?',
        severity="high",
        description="Generic secret/password assignment pattern",
        category="credentials",
    ),

    # ── PII ────────────────────────────────────────────────────────────
    BuiltinPattern(
        id="pii_ssn",
        name="US Social Security Number",
        pattern=r"\b\d{3}-\d{2}-\d{4}\b",
        severity="critical",
        description="US Social Security Number (XXX-XX-XXXX)",
        category="pii",
    ),
    BuiltinPattern(
        id="pii_email",
        name="Email address",
        pattern=r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",
        severity="medium",
        description="Email address",
        category="pii",
    ),
    BuiltinPattern(
        id="pii_phone_us",
        name="US phone number",
        pattern=r"\b(\+1[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}\b",
        severity="medium",
        description="US phone number in common formats",
        category="pii",
    ),
    BuiltinPattern(
        id="pii_ipv4",
        name="IPv4 address",
        pattern=r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b",
        severity="low",
        description="IPv4 address — may indicate internal infrastructure exposure",
        category="pii",
    ),

    # ── Financial ──────────────────────────────────────────────────────
    BuiltinPattern(
        id="fin_credit_card",
        name="Credit card number",
        pattern=r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b",
        severity="critical",
        description="Major credit card number (Visa, MC, Amex, Discover)",
        category="financial",
    ),
    BuiltinPattern(
        id="fin_iban",
        name="IBAN",
        pattern=r"\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?){0,16}\b",
        severity="high",
        description="International Bank Account Number (IBAN)",
        category="financial",
    ),
]

# Pre-compiled for performance on the hot path
_COMPILED: dict[str, re.Pattern] = {
    p.id: re.compile(p.pattern) for p in BUILTIN_PATTERNS
}


def get_pattern(pattern_id: str) -> re.Pattern | None:
    return _COMPILED.get(pattern_id)


def get_all_patterns() -> list[BuiltinPattern]:
    return BUILTIN_PATTERNS
