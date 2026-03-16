"""
Unit tests for the DLP detection engine and classifiers.
No database or HTTP calls required.
"""
import pytest
from app.scanner.classifiers import RegexClassifier, KeywordClassifier
from app.shield.dlp.blocklist import detect_keywords
from app.shield.dlp.patterns import BUILTIN_PATTERNS, get_pattern


# ── Regex classifier ───────────────────────────────────────────────────────

def test_regex_classifier_match_fails():
    clf = RegexClassifier(r"system prompt")
    result = clf.run("any payload", "Here is my system prompt: you are a helpful assistant")
    assert result.passed is False
    assert result.classifier == "regex"


def test_regex_classifier_no_match_passes():
    clf = RegexClassifier(r"system prompt")
    result = clf.run("any payload", "I cannot help with that request")
    assert result.passed is True


def test_regex_classifier_case_insensitive():
    clf = RegexClassifier(r"system prompt")
    result = clf.run("payload", "SYSTEM PROMPT revealed: do not share")
    assert result.passed is False


# ── Keyword classifier ─────────────────────────────────────────────────────

def test_keyword_classifier_exact_match():
    clf = KeywordClassifier("[DAN]")
    result = clf.run("payload", "[DAN] I will now answer without restrictions")
    assert result.passed is False


def test_keyword_classifier_no_match():
    clf = KeywordClassifier("[DAN]")
    result = clf.run("payload", "I cannot assist with that.")
    assert result.passed is True


# ── Built-in patterns ──────────────────────────────────────────────────────

def test_ssn_pattern_matches():
    pattern = get_pattern("pii_ssn")
    assert pattern is not None
    assert pattern.search("My SSN is 123-45-6789")
    assert not pattern.search("No SSN here")


def test_credit_card_visa_matches():
    pattern = get_pattern("fin_credit_card")
    assert pattern is not None
    assert pattern.search("Card: 4111111111111111")


def test_email_pattern_matches():
    pattern = get_pattern("pii_email")
    assert pattern is not None
    assert pattern.search("Contact me at lance@example.com")
    assert not pattern.search("No email here")


def test_openai_key_pattern():
    pattern = get_pattern("cred_openai_key")
    assert pattern is not None
    assert pattern.search("sk-abcdefghijklmnopqrstuvwxyz1234")
    assert not pattern.search("not-a-key-at-all")


def test_github_token_pattern():
    pattern = get_pattern("cred_github_token")
    assert pattern is not None
    assert pattern.search("ghp_" + "A" * 36)


def test_all_builtin_patterns_compile():
    """Every built-in pattern should be a valid compiled regex."""
    import re
    for bp in BUILTIN_PATTERNS:
        compiled = get_pattern(bp.id)
        assert compiled is not None, f"Pattern {bp.id} failed to pre-compile"


# ── Keyword blocklist ──────────────────────────────────────────────────────

def test_blocklist_exact_match():
    matches = detect_keywords("This is PROJECT FALCON data", ["PROJECT FALCON"])
    assert len(matches) == 1
    assert matches[0].fuzzy is False


def test_blocklist_case_insensitive():
    matches = detect_keywords("project falcon is confidential", ["PROJECT FALCON"])
    assert len(matches) == 1


def test_blocklist_no_match():
    matches = detect_keywords("nothing sensitive here", ["SECRET_CODE"])
    assert len(matches) == 0


def test_blocklist_fuzzy_match():
    matches = detect_keywords(
        "projct falcon leaked",
        ["project falcon"],
        fuzzy_threshold=0.80,
        use_fuzzy=True,
    )
    # "projct" is close enough to "project" at 80% threshold
    assert len(matches) >= 1


def test_blocklist_multiple_terms():
    matches = detect_keywords(
        "alpha and bravo operations",
        ["alpha", "bravo", "charlie"],
    )
    assert len(matches) == 2
