import os
import logging
import razorpay

log = logging.getLogger(__name__)

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_SECRET_KEY = os.getenv("RAZORPAY_SECRET_KEY")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

_client = None


def get_razorpay_client():
    """
    Lazily build and cache the Razorpay client. Raises if credentials are
    missing — payment endpoints will return 502 instead of silently failing.
    """
    global _client
    if _client is not None:
        return _client

    if not RAZORPAY_KEY_ID or not RAZORPAY_SECRET_KEY:
        raise RuntimeError(
            "Razorpay credentials missing — set RAZORPAY_KEY_ID and "
            "RAZORPAY_SECRET_KEY in environment."
        )

    _client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_SECRET_KEY))
    return _client


def validate_razorpay_config() -> bool:
    """Call at app startup. Returns True if Razorpay is fully configured."""
    missing = [
        name for name, val in (
            ("RAZORPAY_KEY_ID", RAZORPAY_KEY_ID),
            ("RAZORPAY_SECRET_KEY", RAZORPAY_SECRET_KEY),
            ("RAZORPAY_WEBHOOK_SECRET", RAZORPAY_WEBHOOK_SECRET),
        ) if not val
    ]
    if missing:
        log.warning("Razorpay misconfigured — missing: %s", ", ".join(missing))
        return False
    return True
