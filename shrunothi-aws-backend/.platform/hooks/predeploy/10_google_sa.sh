#!/bin/bash
# Write Google Service Account JSON from environment variable if set
if [ -n "$GOOGLE_SERVICE_ACCOUNT_JSON" ]; then
  echo "$GOOGLE_SERVICE_ACCOUNT_JSON" > /var/app/current/service_account.json
  echo "Google service account file written."
fi
