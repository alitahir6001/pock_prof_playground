#!/usr/bin/env bash
set -euo pipefail

PORT="${ADAPTATION_PORT:-3040}"
HOST="${ADAPTATION_HOST:-127.0.0.1}"
BASE_URL="http://${HOST}:${PORT}"

cat <<'MSG'
[Smoke] Checking health endpoint (expect HTTP 200)...
MSG

HEALTH_STATUS=$(curl -sS -o /tmp/adapt_health.json -w "%{http_code}" "$BASE_URL/adaptation/health")
echo "Health status: $HEALTH_STATUS"
cat /tmp/adapt_health.json
if [[ "$HEALTH_STATUS" != "200" ]]; then
  echo "[Smoke] Expected 200 for /adaptation/health"
  exit 1
fi

cat <<'MSG'
[Smoke] Sending valid payload (expect HTTP 200, ok=true)...
MSG

VALID_STATUS=$(curl -sS -o /tmp/adapt_valid.json -w "%{http_code}" \
  -X POST "$BASE_URL/adaptation/evaluate" \
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
  -X POST "$BASE_URL/adaptation/evaluate" \
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

cat <<'MSG'
[Smoke] Sending oversized payload (expect deterministic 4xx and non-500)...
MSG

OVERSIZED_FILE=/tmp/adapt_oversized.json
if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY'
from pathlib import Path
payload = '{"huge":"' + ('x' * 70000) + '"}'
Path('/tmp/adapt_oversized_payload.json').write_text(payload)
PY
elif command -v python >/dev/null 2>&1; then
  python - <<'PY'
from pathlib import Path
payload = '{"huge":"' + ('x' * 70000) + '"}'
Path('/tmp/adapt_oversized_payload.json').write_text(payload)
PY
else
  BIG=$(head -c 70000 /dev/zero | tr '\0' 'x')
  printf '{"huge":"%s"}' "$BIG" > /tmp/adapt_oversized_payload.json
fi

OVERSIZED_STATUS=$(curl -sS -o "$OVERSIZED_FILE" -w "%{http_code}" \
  -X POST "$BASE_URL/adaptation/evaluate" \
  -H 'content-type: application/json' \
  --data-binary @/tmp/adapt_oversized_payload.json)

echo "Oversized status: $OVERSIZED_STATUS"
cat "$OVERSIZED_FILE"
if [[ "$OVERSIZED_STATUS" != "400" && "$OVERSIZED_STATUS" != "413" ]]; then
  echo "[Smoke] Expected deterministic 4xx for oversized payload"
  exit 1
fi
if grep -q '500' "$OVERSIZED_FILE"; then
  echo "[Smoke] Unexpected 500-like response body for oversized payload"
  exit 1
fi

echo "[Smoke] PASS: runtime returns deterministic success + deterministic failure responses."
