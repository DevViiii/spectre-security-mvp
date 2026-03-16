"""
spectre-shield — Spectre Security runtime DLP SDK.

Quick start:
    from spectre_shield import ShieldClient

    shield = ShieldClient(base_url="https://spectre.yourco.com")
    result = shield.inspect(text=user_prompt, direction="input")
    safe_text = result.text
"""
from spectre_shield.client import ShieldClient
from spectre_shield.types import InspectionResult, ViolationDetail
from spectre_shield.exceptions import (
    ShieldError,
    ShieldBlockedError,
    ShieldConnectionError,
    ShieldTimeoutError,
)

__all__ = [
    "ShieldClient",
    "InspectionResult",
    "ViolationDetail",
    "ShieldError",
    "ShieldBlockedError",
    "ShieldConnectionError",
    "ShieldTimeoutError",
]

__version__ = "0.1.0"
