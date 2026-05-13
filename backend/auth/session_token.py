import os
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional

SECRET = os.getenv("SESSION_SECRET", os.getenv("SECRET_KEY", "change-me-in-production"))
ALGORITHM = "HS256"
EXPIRY_DAYS = 30


def create_session_token(email: str, role: str = "user") -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(days=EXPIRY_DAYS),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def verify_session_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        return {"email": payload["email"], "role": payload.get("role", "user")}
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
