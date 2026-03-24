"""
Email sending for Spectre Security magic links.
Uses Resend (resend.com) — free tier is 3,000 emails/month.

Setup:
  1. Sign up at resend.com
  2. Add RESEND_API_KEY to .env
  3. Verify your sending domain (or use onboarding@resend.dev for testing)

The FROM_EMAIL can be:
  - onboarding@resend.dev (works immediately, no domain needed, for testing)
  - hello@yourdomain.com (requires domain verification in Resend dashboard)
"""
from __future__ import annotations

import httpx
import structlog

from app.config import settings

logger = structlog.get_logger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


async def send_magic_link_email(
    to_email: str,
    magic_link: str,
    is_new_user: bool = False,
) -> bool:
    """
    Sends a magic link email via Resend.
    Returns True on success, False on failure (fail open — don't block the request).
    """
    if not settings.RESEND_API_KEY:
        # Dev mode — log the link instead of sending
        logger.warning(
            "resend_not_configured",
            message="RESEND_API_KEY not set. Magic link logged below for development.",
            magic_link=magic_link,
            to=to_email,
        )
        return True

    subject = "Your Spectre Security access link" if not is_new_user else "Welcome to Spectre Security"

    html = _build_email_html(magic_link, is_new_user)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.EMAIL_FROM,
                    "to": [to_email],
                    "subject": subject,
                    "html": html,
                },
            )
            if response.status_code == 200:
                logger.info("magic_link_email_sent", to=to_email)
                return True
            else:
                logger.error(
                    "magic_link_email_failed",
                    to=to_email,
                    status=response.status_code,
                    body=response.text[:200],
                )
                return False
    except Exception as exc:
        logger.error("magic_link_email_error", to=to_email, error=str(exc))
        return False


async def send_admin_signup_notification(email: str, org_slug: str) -> bool:
    """
    Sends a notification to the admin when a new user signs up.
    Skips silently if ADMIN_NOTIFICATION_EMAIL or RESEND_API_KEY is not set.
    """
    if not settings.ADMIN_NOTIFICATION_EMAIL or not settings.RESEND_API_KEY:
        logger.info("admin_notification_skipped", reason="not configured", new_user=email)
        return False

    from datetime import datetime, timezone
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.EMAIL_FROM,
                    "to": [settings.ADMIN_NOTIFICATION_EMAIL],
                    "subject": "New Spectre Security signup",
                    "html": f"<p>New user signed up: <strong>{email}</strong> at {timestamp}. Organization: <strong>{org_slug}</strong></p>",
                },
            )
            if response.status_code == 200:
                logger.info("admin_notification_sent", new_user=email)
                return True
            else:
                logger.error("admin_notification_failed", status=response.status_code, body=response.text[:200])
                return False
    except Exception as exc:
        logger.error("admin_notification_error", error=str(exc))
        return False


def _build_email_html(magic_link: str, is_new_user: bool) -> str:
    greeting = "Welcome to Spectre Security" if is_new_user else "Your Spectre Security login link"
    intro = (
        "Thanks for signing up. Click the button below to access your dashboard and run your first scan."
        if is_new_user
        else "Click the button below to sign in to your Spectre Security dashboard."
    )

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060608;min-height:100vh;">
    <tr><td align="center" style="padding:48px 24px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0d0d1a;border:1px solid #1c1c2e;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #1c1c2e;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#7c3aed;width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
                <span style="color:white;font-size:18px;font-weight:800;line-height:32px;">S</span>
              </td>
              <td style="padding-left:10px;">
                <span style="font-size:15px;font-weight:700;color:#f4f4f5;letter-spacing:-0.3px;">
                  Spectre <span style="color:#7c3aed;">Security</span>
                </span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f4f4f5;letter-spacing:-0.5px;">
            {greeting}
          </h1>
          <p style="margin:0 0 32px;font-size:15px;color:#71717a;line-height:1.6;">
            {intro}
          </p>

          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr>
              <td style="background:#7c3aed;border-radius:10px;">
                <a href="{magic_link}"
                   style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:white;text-decoration:none;border-radius:10px;">
                  Access your dashboard →
                </a>
              </td>
            </tr>
          </table>

          <!-- Security note -->
          <div style="background:#0a0a14;border:1px solid #1c1c2e;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="margin:0;font-size:12px;color:#52525b;line-height:1.6;">
              🔒 This link expires in <strong style="color:#71717a;">15 minutes</strong> and can only be used once.
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>

          <!-- Fallback link -->
          <p style="margin:0;font-size:12px;color:#3f3f46;line-height:1.6;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="{magic_link}" style="color:#7c3aed;word-break:break-all;">{magic_link}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #1c1c2e;">
          <p style="margin:0;font-size:11px;color:#27272a;text-align:center;">
            Spectre Security · AI Runtime Protection<br>
            You're receiving this because someone entered this email address on spectresecurity.io
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""
