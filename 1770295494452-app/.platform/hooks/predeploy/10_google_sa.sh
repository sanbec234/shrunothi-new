#!/usr/bin/env bash
set -euo pipefail

SECRET_ID="${GOOGLE_SA_SECRET_ID:-}"
if [[ -z "$SECRET_ID" ]]; then
  echo "[google-sa] GOOGLE_SA_SECRET_ID is not set; cannot fetch service account JSON."
  exit 1
fi

STAGING_DIR="${EB_APP_STAGING_DIR:-/var/app/staging}"
TARGET_PATH="$STAGING_DIR/.secrets/google-docs-sa.json"

mkdir -p "$(dirname "$TARGET_PATH")"

echo "[google-sa] Fetching secret '$SECRET_ID' into $TARGET_PATH"
RAW_SECRET="$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" \
  --query SecretString \
  --output text)"

export RAW_SECRET TARGET_PATH
python3 - <<'PY'
import json
import os
import sys

raw = os.environ["RAW_SECRET"]
target = os.environ["TARGET_PATH"]

def is_service_account(obj):
    return isinstance(obj, dict) and obj.get("type") == "service_account" and "client_email" in obj

def write_json(obj):
    with open(target, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)

try:
    parsed = json.loads(raw)
except Exception as exc:
    print(f"[google-sa] Secret is not valid JSON: {exc}", file=sys.stderr)
    sys.exit(1)

candidate = None
if is_service_account(parsed):
    candidate = parsed
elif isinstance(parsed, dict):
    # Support key/value secrets where one value contains the actual SA JSON.
    for value in parsed.values():
        if is_service_account(value):
            candidate = value
            break
        if isinstance(value, str):
            try:
                nested = json.loads(value)
            except Exception:
                continue
            if is_service_account(nested):
                candidate = nested
                break

if candidate is None:
    print(
        "[google-sa] Could not locate service account JSON in secret. "
        "Store raw service account JSON or a key/value containing it.",
        file=sys.stderr,
    )
    sys.exit(1)

write_json(candidate)
print("[google-sa] Parsed and wrote service account JSON.")
PY

chmod 600 "$TARGET_PATH"

if id webapp >/dev/null 2>&1; then
  chown webapp:webapp "$TARGET_PATH"
  chmod 600 "$TARGET_PATH"
fi

echo "[google-sa] Service account key written successfully in staging."
