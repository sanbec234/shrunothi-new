"""
Lightweight email notification service for payment events.

Uses Python's built-in smtplib so there are zero extra dependencies.
Configure via environment variables:

    SMTP_HOST          – SMTP server (default: smtp.gmail.com)
    SMTP_PORT          – SMTP port (default: 587)
    SMTP_USER          – sender email address
    SMTP_PASSWORD      – app password (NOT your regular password)
    SMTP_FROM_NAME     – display name (default: Shrunothi)
    NOTIFICATION_ENABLED – set to "true" to send emails; anything else = log only

If NOTIFICATION_ENABLED != "true", all calls are no-ops that log the intent.
This lets you deploy without SMTP creds and add them later.
"""

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

log = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Shrunothi")
NOTIFICATION_ENABLED = os.getenv("NOTIFICATION_ENABLED", "false").lower() == "true"


# ── Email templates (plain text + minimal HTML) ─────────────────────────────

_TEMPLATES = {
    "captured": {
        "subject": "Payment Successful — Welcome to Shrunothi Pro!",
        "body": (
            "Hi there,\n\n"
            "Your payment for Shrunothi {plan_label} has been successfully processed.\n\n"
            "Order ID: {order_id}\n"
            "Plan: {plan_label}\n\n"
            "You now have full access to all Pro features. "
            "If you have any questions, reply to this email.\n\n"
            "Thank you for supporting Shrunothi!\n"
            "— The Shrunothi Team"
        ),
    },
    "failed": {
        "subject": "Payment Failed — Action Needed",
        "body": (
            "Hi there,\n\n"
            "Unfortunately your payment could not be processed.\n\n"
            "Order ID: {order_id}\n\n"
            "Please try again or use a different payment method. "
            "If the problem persists, contact us by replying to this email.\n\n"
            "— The Shrunothi Team"
        ),
    },
    "refunded": {
        "subject": "Refund Processed — Shrunothi",
        "body": (
            "Hi there,\n\n"
            "Your refund for order {order_id} has been processed. "
            "The amount will be credited back to your original payment method "
            "within 5–7 business days.\n\n"
            "Your Pro access has been deactivated. "
            "You can re-subscribe at any time from the website.\n\n"
            "— The Shrunothi Team"
        ),
    },
    "expiry_warning": {
        "subject": "Your Shrunothi Pro Subscription Expires Soon",
        "body": (
            "Hi there,\n\n"
            "Your Shrunothi Pro monthly subscription expires in {days_left} days.\n\n"
            "To keep uninterrupted access, please renew from the website.\n\n"
            "— The Shrunothi Team"
        ),
    },
}

_PLAN_LABELS = {
    "recurring": "Monthly Plan (₹299/month)",
    "one_time": "Annual Plan (₹2,499/year)",
}


def send_payment_notification(email, event_type, order_id, payment_type=None,
                              extra_context=None):
    """
    Send a payment lifecycle notification email.

    Args:
        email:        recipient email address
        event_type:   one of "captured", "failed", "refunded", "expiry_warning"
        order_id:     Razorpay order ID for reference
        payment_type: "recurring" or "one_time" (optional, for plan label)
        extra_context: dict of extra template vars (e.g. {"days_left": 3})
    """
    template = _TEMPLATES.get(event_type)
    if not template:
        log.warning("No email template for event_type=%s", event_type)
        return

    context = {
        "order_id": order_id or "N/A",
        "plan_label": _PLAN_LABELS.get(payment_type, "Shrunothi Pro"),
        **(extra_context or {}),
    }

    subject = template["subject"]
    body = template["body"].format_map(_SafeFormatDict(context))

    if not NOTIFICATION_ENABLED:
        log.info(
            "Email notification (disabled, not sent): to=%s event=%s order=%s",
            email, event_type, order_id,
        )
        return

    if not SMTP_USER or not SMTP_PASSWORD:
        log.warning("SMTP credentials not configured — email not sent")
        return

    _send_email(to_addr=email, subject=subject, text_body=body)


def _send_email(to_addr, subject, text_body):
    """Low-level SMTP send. Raises on failure (caller catches)."""
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to_addr
    msg["Subject"] = subject
    msg.attach(MIMEText(text_body, "plain", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, [to_addr], msg.as_string())

    log.info("Email sent: to=%s subject=%s", to_addr, subject)


class _SafeFormatDict(dict):
    """str.format_map helper that returns '{key}' for missing keys instead of raising."""
    def __missing__(self, key):
        return f"{{{key}}}"
