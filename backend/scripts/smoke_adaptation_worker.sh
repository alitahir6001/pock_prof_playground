#!/usr/bin/env bash
set -euo pipefail

cat <<'MSG'
[Smoke Worker] Running deterministic worker success path (file mode)...
MSG

<<<<<<< codex/create-behavioral-design-document-gzi0b6
SUCCESS_JSON='{"message_id":"msg_smoke_1","attempt":1,"max_attempts":3,"job_id":"job_smoke_1","payload":{"user_id":"u_worker_1","evaluated_at":"2026-02-11T10:00:00.000Z","trigger_window":"7d","weekly_structural_mutations_applied":0,"counters":{"missed_sessions_7d":2,"late_night_sessions_7d":0,"topic_resistance_triggered":false,"pivot_interest_triggered":false,"consecutive_completed_sessions":0},"previous_state":{"difficulty":1},"new_state":{"difficulty":1,"workload":75}}}'

SUCCESS_OUT=$(ADAPTATION_PERSISTENCE_MODE=file ADAPTATION_AUDIT_FILE="${ADAPTATION_AUDIT_FILE:-./data/adaptation-evaluations.json}" ADAPTATION_WORKER_IDEMPOTENCY_FILE="${ADAPTATION_WORKER_IDEMPOTENCY_FILE:-./data/adaptation-worker-idempotency.json}" ADAPTATION_WORKER_JOB_JSON="$SUCCESS_JSON" node scripts/run_adaptation_worker.mjs)
=======
SUCCESS_JSON='{"job_id":"job_smoke_1","payload":{"user_id":"u_worker_1","evaluated_at":"2026-02-11T10:00:00.000Z","trigger_window":"7d","weekly_structural_mutations_applied":0,"counters":{"missed_sessions_7d":2,"late_night_sessions_7d":0,"topic_resistance_triggered":false,"pivot_interest_triggered":false,"consecutive_completed_sessions":0},"previous_state":{"difficulty":1},"new_state":{"difficulty":1,"workload":75}}}'

SUCCESS_OUT=$(ADAPTATION_PERSISTENCE_MODE=file ADAPTATION_AUDIT_FILE="${ADAPTATION_AUDIT_FILE:-./data/adaptation-evaluations.json}" ADAPTATION_WORKER_JOB_JSON="$SUCCESS_JSON" node scripts/run_adaptation_worker.mjs)
>>>>>>> main
echo "$SUCCESS_OUT"

echo "$SUCCESS_OUT" | rg '"ok":true' >/dev/null || {
  echo "[Smoke Worker] Expected ok=true for success path"
  exit 1
}

echo "$SUCCESS_OUT" | rg '"status":"completed"' >/dev/null || {
  echo "[Smoke Worker] Expected completed status for success path"
  exit 1
}

cat <<'MSG'
[Smoke Worker] Running deterministic worker bad-payload path...
MSG

<<<<<<< codex/create-behavioral-design-document-gzi0b6
FAIL_JSON='{"message_id":"msg_smoke_bad","attempt":1,"max_attempts":3,"job_id":"job_smoke_bad","payload":{"user_id":"u_bad"}}'

FAIL_OUT=$(ADAPTATION_PERSISTENCE_MODE=file ADAPTATION_AUDIT_FILE="${ADAPTATION_AUDIT_FILE:-./data/adaptation-evaluations.json}" ADAPTATION_WORKER_IDEMPOTENCY_FILE="${ADAPTATION_WORKER_IDEMPOTENCY_FILE:-./data/adaptation-worker-idempotency.json}" ADAPTATION_WORKER_JOB_JSON="$FAIL_JSON" node scripts/run_adaptation_worker.mjs)
=======
FAIL_JSON='{"job_id":"job_smoke_bad","payload":{"user_id":"u_bad"}}'

FAIL_OUT=$(ADAPTATION_PERSISTENCE_MODE=file ADAPTATION_AUDIT_FILE="${ADAPTATION_AUDIT_FILE:-./data/adaptation-evaluations.json}" ADAPTATION_WORKER_JOB_JSON="$FAIL_JSON" node scripts/run_adaptation_worker.mjs)
>>>>>>> main
echo "$FAIL_OUT"

echo "$FAIL_OUT" | rg '"status":"failed"' >/dev/null || {
  echo "[Smoke Worker] Expected failed status for invalid payload"
  exit 1
}

<<<<<<< codex/create-behavioral-design-document-gzi0b6
echo "$FAIL_OUT" | rg '"retryable":false' >/dev/null || {
  echo "[Smoke Worker] Expected non-retryable directive for validation failure"
  exit 1
}

=======
>>>>>>> main
echo "[Smoke Worker] PASS"
