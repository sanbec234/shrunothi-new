#!/bin/bash
# Fix permissions on service account file
if [ -f /var/app/current/service_account.json ]; then
  chmod 600 /var/app/current/service_account.json
  echo "Google service account permissions set."
fi
