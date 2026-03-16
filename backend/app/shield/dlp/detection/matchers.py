"""
Matchers execute rules against text and produce Findings.
Each matcher owns one category. The DetectionEngine calls all of them.

Design principles:
  - Matchers are stateless — instantiated once, called many times
  - All regex is pre-compiled at import time (not per-call)
  - Deduplication: same rule ID fires at most once per inspection
  - Heuristics run additional structural checks beyond simple regex
"""
from __future__ import annotations

import re
from abc import ABC, abstractmethod

from app.shield.dlp.detection.base import Direction, Finding, Rule
from app.shield.dlp.detection.rules import (
    HEURISTIC_RULES,
    INJECTION_RULES,
    JAILBREAK_RULES,
    LEAK_RULES,
    SECRET_RULES,
    RULES_BY_ID,
)


class BaseMatcher(ABC):
    """Abstract base for all matchers."""

    def __init__(self, rules: list[Rule]):
        self.rules = rules
        self._compiled: dict[str, re.Pattern] = {}
        self._precompile()

    def _precompile(self) -> None:
        for rule in self.rules:
            if not rule.pattern.startswith("__heuristic_"):
                try:
                    self._compiled[rule.id] = re.compile(rule.pattern, re.IGNORECASE | re.DOTALL)
                except re.error:
                    pass

    @abstractmethod
    def run(self, text: str, direction: Direction) -> list[Finding]:
        ...

    def _applies(self, rule: Rule, direction: Direction) -> bool:
        return rule.applies_to == "both" or rule.applies_to == direction

    def _make_finding(
        self,
        rule: Rule,
        match: re.Match,
        direction: Direction,
        confidence: float = 1.0,
    ) -> Finding:
        matched = match.group()[:200]
        return Finding(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category,
            severity=rule.severity,
            matched_text=matched,
            match_start=match.start(),
            match_end=match.end(),
            direction=direction,
            confidence=confidence,
        )


class SecretMatcher(BaseMatcher):
    """Detects credentials, API keys, tokens, and sensitive PII."""

    def __init__(self):
        super().__init__(SECRET_RULES)

    def run(self, text: str, direction: Direction) -> list[Finding]:
        findings: list[Finding] = []
        seen_rules: set[str] = set()

        for rule in self.rules:
            if rule.id in seen_rules:
                continue
            if not self._applies(rule, direction):
                continue
            compiled = self._compiled.get(rule.id)
            if not compiled:
                continue
            match = compiled.search(text)
            if match:
                findings.append(self._make_finding(rule, match, direction))
                seen_rules.add(rule.id)

        return findings


class InjectionMatcher(BaseMatcher):
    """Detects prompt injection and instruction override attempts."""

    def __init__(self):
        super().__init__(INJECTION_RULES)

    def run(self, text: str, direction: Direction) -> list[Finding]:
        findings: list[Finding] = []
        seen_rules: set[str] = set()

        for rule in self.rules:
            if rule.id in seen_rules:
                continue
            if not self._applies(rule, direction):
                continue
            compiled = self._compiled.get(rule.id)
            if not compiled:
                continue
            match = compiled.search(text)
            if match:
                findings.append(self._make_finding(rule, match, direction))
                seen_rules.add(rule.id)

        return findings


class LeakMatcher(BaseMatcher):
    """Detects attempts to extract system prompt or hidden instructions."""

    def __init__(self):
        super().__init__(LEAK_RULES)

    def run(self, text: str, direction: Direction) -> list[Finding]:
        findings: list[Finding] = []
        seen_rules: set[str] = set()

        for rule in self.rules:
            if rule.id in seen_rules:
                continue
            if not self._applies(rule, direction):
                continue
            compiled = self._compiled.get(rule.id)
            if not compiled:
                continue
            match = compiled.search(text)
            if match:
                findings.append(self._make_finding(rule, match, direction))
                seen_rules.add(rule.id)

        return findings


class JailbreakMatcher(BaseMatcher):
    """Detects known jailbreak phrases and persona-switching attacks."""

    def __init__(self):
        super().__init__(JAILBREAK_RULES)

    def run(self, text: str, direction: Direction) -> list[Finding]:
        findings: list[Finding] = []
        seen_rules: set[str] = set()

        for rule in self.rules:
            if rule.id in seen_rules:
                continue
            if not self._applies(rule, direction):
                continue
            compiled = self._compiled.get(rule.id)
            if not compiled:
                continue
            match = compiled.search(text)
            if match:
                findings.append(self._make_finding(rule, match, direction))
                seen_rules.add(rule.id)

        return findings


class HeuristicMatcher(BaseMatcher):
    """
    Structural heuristics that detect suspicious patterns
    not capturable by a single regex.
    """

    # Imperative verbs associated with injection attempts
    IMPERATIVE_VERBS = re.compile(
        r"(?i)\b(ignore|forget|disregard|override|bypass|disable|remove|delete|"
        r"pretend|act\s+as|respond\s+as|speak\s+as|behave\s+as)\b"
    )

    def __init__(self):
        super().__init__(HEURISTIC_RULES)

    def run(self, text: str, direction: Direction) -> list[Finding]:
        findings: list[Finding] = []

        for rule in self.rules:
            if not self._applies(rule, direction):
                continue

            if rule.pattern.startswith("__heuristic_"):
                # Special-case heuristics
                result = self._run_special(rule, text, direction)
                if result:
                    findings.append(result)
            else:
                compiled = self._compiled.get(rule.id)
                if compiled:
                    match = compiled.search(text)
                    if match:
                        findings.append(self._make_finding(rule, match, direction))

        return findings

    def _run_special(
        self, rule: Rule, text: str, direction: Direction
    ) -> Finding | None:
        if rule.id == "heur_instruction_density":
            return self._check_instruction_density(rule, text, direction)
        if rule.id == "heur_excessive_repetition":
            return self._check_repetition(rule, text, direction)
        if rule.id == "heur_secret_in_output":
            return self._check_secret_in_output(rule, text, direction)
        return None

    def _check_instruction_density(
        self, rule: Rule, text: str, direction: Direction
    ) -> Finding | None:
        """Fire if 4+ imperative verbs appear in a 200-char window."""
        words = self.IMPERATIVE_VERBS.findall(text)
        if len(words) < 4:
            return None
        matches = list(self.IMPERATIVE_VERBS.finditer(text))
        # Check density in any 200-char window
        for i, m in enumerate(matches):
            window_matches = [
                x for x in matches[i:]
                if x.start() - m.start() <= 200
            ]
            if len(window_matches) >= 4:
                return Finding(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    category=rule.category,
                    severity=rule.severity,
                    matched_text=text[m.start():m.start() + 100],
                    match_start=m.start(),
                    match_end=m.start() + 100,
                    direction=direction,
                    confidence=0.75,
                )
        return None

    def _check_repetition(
        self, rule: Rule, text: str, direction: Direction
    ) -> Finding | None:
        """Fire if any phrase of 5+ words appears 3+ times."""
        words = text.lower().split()
        if len(words) < 15:
            return None
        # Check 5-gram repetition
        ngrams: dict[str, int] = {}
        for i in range(len(words) - 4):
            ngram = " ".join(words[i:i+5])
            ngrams[ngram] = ngrams.get(ngram, 0) + 1
        repeated = [(ng, c) for ng, c in ngrams.items() if c >= 3]
        if not repeated:
            return None
        top_ngram, _ = max(repeated, key=lambda x: x[1])
        idx = text.lower().find(top_ngram)
        return Finding(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category,
            severity=rule.severity,
            matched_text=top_ngram,
            match_start=max(0, idx),
            match_end=max(0, idx) + len(top_ngram),
            direction=direction,
            confidence=0.8,
        )

    def _check_secret_in_output(
        self, rule: Rule, text: str, direction: Direction
    ) -> Finding | None:
        """Check output for credential-like patterns using the SecretMatcher."""
        if direction != "output":
            return None
        secret_matcher = SecretMatcher()
        secret_findings = secret_matcher.run(text, direction="output")
        if not secret_findings:
            return None
        f = secret_findings[0]
        return Finding(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category,
            severity="high",
            matched_text=f.matched_text,
            match_start=f.match_start,
            match_end=f.match_end,
            direction=direction,
            confidence=0.9,
        )
