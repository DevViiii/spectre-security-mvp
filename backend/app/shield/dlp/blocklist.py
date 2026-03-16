"""
Keyword blocklist detector.
Supports exact match and optional fuzzy match (via difflib, no extra deps).
Customer-defined terms are passed in via policy rule_config.
"""
from __future__ import annotations

import difflib
from dataclasses import dataclass


@dataclass(frozen=True)
class BlocklistMatch:
    term: str
    matched_text: str
    fuzzy: bool
    score: float  # 1.0 for exact, <1.0 for fuzzy


def detect_keywords(
    text: str,
    terms: list[str],
    fuzzy_threshold: float = 0.85,
    use_fuzzy: bool = False,
) -> list[BlocklistMatch]:
    """
    Scans text for occurrences of any term in the blocklist.

    Exact match: checks if term appears as a word boundary substring.
    Fuzzy match: uses difflib SequenceMatcher on word tokens; only fires
                 when use_fuzzy=True and fuzzy_threshold is set.

    Returns a list of matches found. Empty list = clean.
    """
    if not terms or not text:
        return []

    text_lower = text.lower()
    words = text_lower.split()
    matches: list[BlocklistMatch] = []

    for term in terms:
        term_lower = term.lower()

        # Exact substring match
        if term_lower in text_lower:
            matches.append(BlocklistMatch(
                term=term,
                matched_text=term,
                fuzzy=False,
                score=1.0,
            ))
            continue

        # Fuzzy word-level match (optional, for typo tolerance)
        if use_fuzzy:
            for word in words:
                ratio = difflib.SequenceMatcher(None, term_lower, word).ratio()
                if ratio >= fuzzy_threshold:
                    matches.append(BlocklistMatch(
                        term=term,
                        matched_text=word,
                        fuzzy=True,
                        score=ratio,
                    ))
                    break

    return matches
