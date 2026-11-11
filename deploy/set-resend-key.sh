#!/usr/bin/env bash
# Stores the Resend API key in .env (typed or pasted with hidden input) and
# restarts the site so it takes effect. Run it on the server:
#   /opt/marketingchains/deploy/set-resend-key.sh
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .env ] || { echo ".env not found in $(pwd). Nothing was changed."; exit 1; }

read -rsp "Paste your Resend API key and press Enter (nothing will show on screen): " KEY
echo

# Tolerate stray spaces, line breaks, or quotes from copy and paste.
KEY="${KEY//[[:space:]]/}"
KEY="${KEY#\"}"
KEY="${KEY%\"}"

if [[ ! "$KEY" =~ ^re_[A-Za-z0-9_]{16,}$ ]]; then
  echo "That does not look like a Resend API key (they start with re_ and are 30 or more characters)."
  echo "Nothing was changed. Run this script again and paste the key."
  exit 1
fi

if grep -q '^RESEND_API_KEY=' .env; then
  tmp="$(mktemp)"
  awk -v key="$KEY" 'BEGIN { FS = OFS = "=" } /^RESEND_API_KEY=/ { print "RESEND_API_KEY=" key; next } { print }' .env > "$tmp"
  cat "$tmp" > .env
  rm -f "$tmp"
else
  printf 'RESEND_API_KEY=%s\n' "$KEY" >> .env
fi
chmod 600 .env
unset KEY

docker compose up -d
echo
echo "Saved. The site was restarted with the new key."
echo "Now send a test message from the website's Contact Us form."
