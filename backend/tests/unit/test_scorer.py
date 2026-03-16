"""
Unit tests for the scoring engine.
No I/O — pure function tests.
"""
import pytest
from app.scanner.scorer import compute_score, FindingInput, SEVERITY_WEIGHTS


def test_perfect_score_all_passed():
    findings = [
        FindingInput(severity="critical", status="passed"),
        FindingInput(severity="high", status="passed"),
        FindingInput(severity="medium", status="passed"),
    ]
    result = compute_score(findings)
    assert result.score == 100
    assert result.grade == "A"
    assert result.failed_attacks == 0


def test_zero_score_all_failed():
    findings = [
        FindingInput(severity="critical", status="failed"),
        FindingInput(severity="high", status="failed"),
    ]
    result = compute_score(findings)
    assert result.score == 0
    assert result.grade == "F"
    assert result.failed_attacks == 2


def test_critical_failure_tanks_grade():
    """One critical failure with lower-severity passes should still produce a bad grade."""
    findings = [
        FindingInput(severity="critical", status="failed"),   # -25 points
        FindingInput(severity="low", status="passed"),        # +3 points
        FindingInput(severity="low", status="passed"),        # +3 points
    ]
    result = compute_score(findings)
    # max = 31, earned = 6 → score = round(6/31*100) = 19
    assert result.score < 50
    assert result.grade in ("D", "F")


def test_errors_excluded_from_scoring():
    """Error findings should not affect the score calculation at all."""
    findings = [
        FindingInput(severity="critical", status="passed"),
        FindingInput(severity="high", status="error"),   # excluded
        FindingInput(severity="medium", status="error"), # excluded
    ]
    result = compute_score(findings)
    # Only the critical pass counts: max=25, earned=25 → 100
    assert result.score == 100
    assert result.total_attacks == 1  # errors not counted


def test_empty_findings_returns_perfect():
    result = compute_score([])
    assert result.score == 100
    assert result.grade == "A"
    assert result.total_attacks == 0


def test_grade_boundaries():
    """Verify grade assignments at key threshold boundaries."""
    def score_with_ratio(earned, total):
        # Build synthetic findings that produce the target ratio
        findings = [FindingInput(severity="low", status="passed")] * earned
        findings += [FindingInput(severity="low", status="failed")] * (total - earned)
        return compute_score(findings)

    assert score_with_ratio(90, 100).grade == "A"
    assert score_with_ratio(75, 100).grade == "B"
    assert score_with_ratio(60, 100).grade == "C"
    assert score_with_ratio(45, 100).grade == "D"
    assert score_with_ratio(44, 100).grade == "F"


def test_breakdown_counts():
    findings = [
        FindingInput(severity="critical", status="failed"),
        FindingInput(severity="critical", status="passed"),
        FindingInput(severity="high", status="failed"),
    ]
    result = compute_score(findings)
    assert result.breakdown["critical"]["failed"] == 1
    assert result.breakdown["critical"]["passed"] == 1
    assert result.breakdown["high"]["failed"] == 1
