#!/usr/bin/env bash
set -euo pipefail

TARGET_PATH="/var/app/current/.secrets/google-docs-sa.json"

if [[ ! -f "$TARGET_PATH" ]]; then
  echo "[google-sa] No service account file found at $TARGET_PATH during postdeploy."
  exit 0
fi

if id webapp >/dev/null 2>&1; then
  chown webapp:webapp "$TARGET_PATH"
  chmod 600 "$TARGET_PATH"
  echo "[google-sa] Updated ownership to webapp:webapp and chmod 600 on $TARGET_PATH"
else
  chmod 644 "$TARGET_PATH"
  echo "[google-sa] webapp user not found; set chmod 644 on $TARGET_PATH"
fi
