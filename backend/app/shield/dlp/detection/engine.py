"""
DetectionEngine — the primary public interface for Spectre Security detection.

Usage:
    engine = DetectionEngine()                     # instantiate once at startup
    result = engine.run(text, direction="input")   # call per inspection
    print(result.verdict, result.score, result.findings)
"""
from __future__ import annotations

import time

from app.shield.dlp.detection.base import DetectionResult, Direction, Finding
from app.shield.dlp.detection.matchers import (
    HeuristicMatcher,
    InjectionMatcher,
    JailbreakMatcher,
    LeakMatcher,
    SecretMatcher,
)
from app.shield.dlp.detection.scorer import score_findings


class DetectionEngine:
    """
    Orchestrates all matchers against a piece of text.
    Thread-safe — matchers are stateless after construction.
    Instantiate once; call run() many times.
    """

    def __init__(self):
        self._secret    = SecretMatcher()
        self._injection = InjectionMatcher()
        self._leak      = LeakMatcher()
        self._jailbreak = JailbreakMatcher()
        self._heuristic = HeuristicMatcher()

    def run(self, text: str, direction: Direction = "input") -> DetectionResult:
        """
        Runs all matchers against text and returns a DetectionResult.

        Parameters
        ----------
        text:
            The prompt (direction="input") or LLM response (direction="output").
        direction:
            Whether this is incoming user text or outgoing model text.
            Affects which rules fire and direction multipliers in scoring.

        Returns
        -------
        DetectionResult with score, verdict, and all findings.
        """
        start = time.perf_counter()

        all_findings: list[Finding] = []
        all_findings += self._secret.run(text, direction)
        all_findings += self._injection.run(text, direction)
        all_findings += self._leak.run(text, direction)
        all_findings += self._jailbreak.run(text, direction)
        all_findings += self._heuristic.run(text, direction)

        score, verdict = score_findings(all_findings)

        result = DetectionResult(
            direction=direction,
            text_length=len(text),
            score=score,
            verdict=verdict,
            findings=all_findings,
            inspection_ms=round((time.perf_counter() - start) * 1000, 2),
        )

        # Populate convenience category buckets
        for f in all_findings:
            if f.category == "secret":
                result.secrets.append(f)
            elif f.category == "injection":
                result.injections.append(f)
            elif f.category == "leak":
                result.leaks.append(f)
            elif f.category == "jailbreak":
                result.jailbreaks.append(f)
            elif f.category == "heuristic":
                result.heuristics.append(f)

        return result

    def run_both(self, prompt: str, response: str) -> tuple[DetectionResult, DetectionResult]:
        """
        Convenience method: inspect a prompt/response pair together.
        Returns (input_result, output_result).
        """
        return self.run(prompt, "input"), self.run(response, "output")


# Module-level singleton — safe to import directly
_engine: DetectionEngine | None = None


def get_engine() -> DetectionEngine:
    """Returns the module-level singleton DetectionEngine."""
    global _engine
    if _engine is None:
        _engine = DetectionEngine()
    return _engine
