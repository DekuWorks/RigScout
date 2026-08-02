"""Optional SMTP delivery for price alerts."""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from src.core.config import Settings

logger = logging.getLogger("rigscout.email")


def send_alert_email(
    settings: Settings,
    *,
    to_email: str,
    subject: str,
    body: str,
) -> bool:
    """Send email when SMTP is configured. Returns False when skipped/failed."""
    if not settings.email_configured:
        logger.info("SMTP not configured — skipping email to %s", to_email)
        return False

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            smtp.starttls()
            smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
        logger.info("Sent alert email to %s", to_email)
        return True
    except Exception:
        logger.exception("Failed to send alert email to %s", to_email)
        return False
