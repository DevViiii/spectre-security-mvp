"""
PDF report generator.
Renders a Jinja2 HTML template → WeasyPrint → PDF bytes.
Called by the Celery report task, not directly from routes.
"""
from __future__ import annotations

import uuid
from pathlib import Path

import structlog

logger = structlog.get_logger(__name__)

TEMPLATES_DIR = Path(__file__).parent / "templates"


def generate_pdf_bytes(scan_data: dict) -> bytes:
    """
    Takes a scan data dict and returns PDF bytes.
    Raises ImportError if WeasyPrint is not installed (graceful degradation).
    """
    try:
        import weasyprint
        from jinja2 import Environment, FileSystemLoader
    except ImportError as exc:
        raise ImportError(
            "PDF generation requires: pip install weasyprint jinja2"
        ) from exc

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=True,
    )
    template = env.get_template("scan_report.html.j2")
    html_content = template.render(**scan_data)

    pdf = weasyprint.HTML(string=html_content, base_url=str(TEMPLATES_DIR)).write_pdf()
    logger.info("pdf_generated", scan_id=scan_data.get("scan_id"), size_bytes=len(pdf))
    return pdf


def build_report_context(scan, findings: list) -> dict:
    """Shapes a Scan ORM object + findings into the template context dict."""
    from datetime import datetime, timezone
    from app.scanner.attacks.loader import OWASP_CATEGORY_MAP

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    sorted_findings = sorted(findings, key=lambda f: severity_order.get(f.severity, 99))

    # Enrich findings with OWASP data and field aliases expected by template
    enriched = []
    for f in sorted_findings:
        owasp_default = OWASP_CATEGORY_MAP.get(f.category, ("", ""))
        finding_dict = _to_dict(f)
        finding_dict.setdefault("owasp", owasp_default[0])
        finding_dict.setdefault("owasp_name", owasp_default[1])
        finding_dict.setdefault("risk", "")
        finding_dict.setdefault("remediation", [])
        finding_dict.setdefault("attack_name", f.attack_id)
        # Template uses 'response' not 'response_excerpt'
        finding_dict["response"] = finding_dict.get("response_excerpt", "")
        enriched.append(type("Finding", (), finding_dict)())

    breakdown: dict[str, dict] = {}
    for f in sorted_findings:
        if f.severity not in breakdown:
            breakdown[f.severity] = {"passed": 0, "failed": 0, "total": 0}
        breakdown[f.severity]["total"] += 1
        breakdown[f.severity][f.status if f.status in ("passed", "failed") else "failed"] += 1

    # Wrap scan so template can use scan.id[:8] (UUID needs to be a string)
    scan_dict = _to_dict(scan)
    scan_dict["id"] = str(scan.id)
    scan_proxy = type("Scan", (), scan_dict)()

    return {
        "scan": scan_proxy,
        "findings": enriched,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        # Keep legacy fields for backwards compatibility
        "scan_id": str(scan.id),
        "scan_name": scan.name or f"Scan {str(scan.id)[:8]}",
        "target_url": scan.target_url,
        "attack_suite": scan.attack_suite,
        "score": scan.score,
        "grade": scan.grade,
        "total_attacks": scan.total_attacks,
        "failed_attacks": scan.failed_attacks,
        "created_at": scan.created_at.strftime("%Y-%m-%d %H:%M UTC"),
        "completed_at": scan.completed_at.strftime("%Y-%m-%d %H:%M UTC") if scan.completed_at else "—",
        "breakdown": breakdown,
        "grade_color": _grade_color(scan.grade),
    }


def _to_dict(obj) -> dict:
    """Convert an ORM object or dict-like to a plain dict."""
    if hasattr(obj, "__dict__"):
        return {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
    return dict(obj)


def _grade_color(grade: str | None) -> str:
    return {
        "A": "#16a34a",
        "B": "#65a30d",
        "C": "#d97706",
        "D": "#ea580c",
        "F": "#dc2626",
    }.get(grade or "F", "#6b7280")
