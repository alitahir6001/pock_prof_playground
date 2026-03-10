#!/usr/bin/env bash
set -euo pipefail

PORT="${ADAPTATION_PORT:-3040}"
HOST="${ADAPTATION_HOST:-127.0.0.1}"
BASE_URL="http://${HOST}:${PORT}/adaptation/evaluate"

cat <<'MSG'
[Smoke] Sending valid payload (expect HTTP 200, ok=true)...
MSG

VALID_STATUS=$(curl -sS -o /tmp/adapt_valid.json -w "%{http_code}" \
  -X POST "$BASE_URL" \
  -H 'content-type: application/json' \
  -d '{
    "user_id": "u_smoke_1",
    "evaluated_at": "2026-02-11T10:00:00.000Z",
    "trigger_window": "7d",
    "weekly_structural_mutations_applied": 0,
    "counters": {
      "missed_sessions_7d": 2,
      "late_night_sessions_7d": 0,
      "topic_resistance_triggered": false,
      "pivot_interest_triggered": false,
      "consecutive_completed_sessions": 0
    },
    "previous_state": {"difficulty": 1},
    "new_state": {"difficulty": 1, "workload": 75}
  }')

echo "Valid status: $VALID_STATUS"
cat /tmp/adapt_valid.json

if [[ "$VALID_STATUS" != "200" ]]; then
  echo "[Smoke] Expected 200 for valid payload"
  exit 1
fi

cat <<'MSG'
[Smoke] Sending malformed payload (expect HTTP 400, BAD_REQUEST)...
MSG

INVALID_STATUS=$(curl -sS -o /tmp/adapt_invalid.json -w "%{http_code}" \
  -X POST "$BASE_URL" \
  -H 'content-type: application/json' \
  -d '{"user_id":"u_smoke_bad"}')

echo "Invalid status: $INVALID_STATUS"
cat /tmp/adapt_invalid.json

if [[ "$INVALID_STATUS" != "400" ]]; then
  echo "[Smoke] Expected 400 for malformed payload"
  exit 1
fi

if ! grep -q 'BAD_REQUEST' /tmp/adapt_invalid.json; then
  echo "[Smoke] Expected BAD_REQUEST error code for malformed payload"
  exit 1
fi

echo "[Smoke] PASS: runtime returns deterministic success + deterministic failure responses."
