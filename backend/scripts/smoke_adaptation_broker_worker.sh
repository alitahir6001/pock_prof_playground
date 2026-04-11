#!/usr/bin/env bash
set -euo pipefail

QUEUE_FILE="${ADAPTATION_BROKER_QUEUE_FILE:-./data/adaptation-broker-queue.json}"
RETRY_FILE="${ADAPTATION_BROKER_RETRY_FILE:-./data/adaptation-broker-retry.json}"
DLQ_FILE="${ADAPTATION_BROKER_DLQ_FILE:-./data/adaptation-broker-dlq.json}"
METRICS_FILE="${ADAPTATION_BROKER_METRICS_FILE:-./data/adaptation-broker-metrics.json}"

mkdir -p "$(dirname "$QUEUE_FILE")"

cat > "$QUEUE_FILE" <<'JSON'
[
  {
    "message_id": "msg_broker_ok",
    "attempt": 1,
    "max_attempts": 3,
    "job_id": "job_broker_ok",
    "payload": {
      "user_id": "u_broker_1",
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
    }
  },
  {
    "message_id": "msg_broker_bad",
    "attempt": 1,
    "max_attempts": 3,
    "job_id": "job_broker_bad",
    "payload": {
      "user_id": "u_bad"
    }
  }
]
JSON

OUT=$(ADAPTATION_PERSISTENCE_MODE=file ADAPTATION_AUDIT_FILE="${ADAPTATION_AUDIT_FILE:-./data/adaptation-evaluations.json}" ADAPTATION_BROKER_QUEUE_FILE="$QUEUE_FILE" ADAPTATION_BROKER_RETRY_FILE="$RETRY_FILE" ADAPTATION_BROKER_DLQ_FILE="$DLQ_FILE" ADAPTATION_BROKER_METRICS_FILE="$METRICS_FILE" node scripts/run_adaptation_broker_worker.mjs)
echo "$OUT"

echo "$OUT" | rg '"ok":true' >/dev/null || {
  echo "[Smoke Broker] expected ok=true"
  exit 1
}

cat "$METRICS_FILE"
cat "$DLQ_FILE"

echo "[Smoke Broker] PASS"
