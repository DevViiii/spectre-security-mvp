"""
Spectre Shield Python SDK.

Usage:
    from spectre_shield import ShieldClient

    shield = ShieldClient(
        base_url="https://spectre.yourco.com",
        api_key="sk-spectre-...",   # optional for /inspect
    )

    # Inspect a prompt before sending to your LLM
    result = shield.inspect(text=user_prompt, direction="input")
    if result.was_blocked:
        raise ValueError("Prompt blocked by security policy")
    safe_prompt = result.text  # may be redacted

    # Inspect the LLM response before returning to the user
    result = shield.inspect(text=llm_response, direction="output")
    return result.text
"""
from __future__ import annotations

import urllib.request
import urllib.error
import json
import time
from typing import Any

from spectre_shield.types import InspectionResult, ViolationDetail
from spectre_shield.exceptions import (
    ShieldBlockedError,
    ShieldConnectionError,
    ShieldTimeoutError,
)


class ShieldClient:
    """
    Synchronous HTTP client for the Spectre Shield inspection API.

    Parameters
    ----------
    base_url:
        Base URL of the Spectre Security deployment (no trailing slash).
    api_key:
        Optional Spectre API key. Required for policy management endpoints;
        not required for /shield/inspect.
    timeout_ms:
        Maximum milliseconds to wait for an inspection response.
        Defaults to 5000ms. Set to 0 to disable.
    fail_open:
        If True (default), allow requests through when the Shield endpoint
        is unreachable rather than blocking all LLM traffic.
        Set to False for strict mode (block on Shield unavailability).
    raise_on_block:
        If True, raise ShieldBlockedError when action=block.
        If False (default), return the result and let the caller decide.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str | None = None,
        timeout_ms: int = 5000,
        fail_open: bool = True,
        raise_on_block: bool = False,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout_s = timeout_ms / 1000.0
        self.fail_open = fail_open
        self.raise_on_block = raise_on_block

    def inspect(
        self,
        text: str,
        direction: str = "input",
        context: dict[str, Any] | None = None,
    ) -> InspectionResult:
        """
        Sends text to the Shield /inspect endpoint and returns the result.

        Parameters
        ----------
        text:
            The prompt (direction="input") or LLM response (direction="output").
        direction:
            "input" or "output".
        context:
            Optional metadata dict (session_id, user_id, etc.) for logging.

        Returns
        -------
        InspectionResult
            .text        — original text, or redacted text if action=redact
            .allowed     — False only if action=block
            .violations  — list of matched policies
        """
        payload = json.dumps({
            "text": text,
            "direction": direction,
            "context": context or {},
        }).encode("utf-8")

        url = f"{self.base_url}/shield/inspect"
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-Api-Key"] = self.api_key

        try:
            req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.URLError as exc:
            if isinstance(exc.reason, TimeoutError):
                return self._handle_error(text, ShieldTimeoutError(str(exc)))
            return self._handle_error(text, ShieldConnectionError(str(exc)))
        except Exception as exc:
            return self._handle_error(text, ShieldConnectionError(str(exc)))

        return self._parse_response(body, text)

    def inspect_input(self, text: str, **kwargs) -> InspectionResult:
        """Convenience wrapper — inspect a user prompt."""
        return self.inspect(text, direction="input", **kwargs)

    def inspect_output(self, text: str, **kwargs) -> InspectionResult:
        """Convenience wrapper — inspect an LLM response."""
        return self.inspect(text, direction="output", **kwargs)

    def _parse_response(self, body: dict, original_text: str) -> InspectionResult:
        violations = [
            ViolationDetail(
                policy_id=v.get("policy_id", ""),
                policy_name=v.get("policy_name", ""),
                rule_type=v.get("rule_type", ""),
                action=v.get("action", ""),
                matched_pattern=v.get("matched_pattern"),
                match_location=v.get("match_location"),
            )
            for v in body.get("violations", [])
        ]

        action = body.get("action", "allow")
        # Use modified_text if provided (redact case), else original
        effective_text = body.get("modified_text") or original_text

        result = InspectionResult(
            allowed=body.get("allowed", True),
            action=action,
            text=effective_text,
            violations=violations,
            inspection_ms=body.get("inspection_ms", 0.0),
        )

        if not result.allowed and self.raise_on_block:
            raise ShieldBlockedError(result)

        return result

    def _handle_error(self, text: str, exc: Exception) -> InspectionResult:
        """
        Called when the Shield endpoint is unreachable.
        fail_open=True → return a clean allow result (keep LLM traffic flowing).
        fail_open=False → re-raise the exception.
        """
        if self.fail_open:
            return InspectionResult(
                allowed=True,
                action="allow",
                text=text,
                violations=[],
                inspection_ms=0.0,
            )
        raise exc
