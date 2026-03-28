# Adaptation Runtime Troubleshooting Guide

This guide maps common adaptation runtime failures to diagnostic signals and immediate remediation steps.

## Logging + diagnostic model
Runtime and framework bindings now emit/return `diagnostic_code` values:
- `VALIDATION_ERROR`
- `AUDIT_PERSISTENCE_FAILURE`
- `CONFIGURATION_ERROR`
- `UNKNOWN_ERROR`

## Fast triage checklist
1. Confirm persistence mode and env vars.
2. Confirm migration/table exists (if Postgres mode).
3. Re-run deterministic tests.
4. Reproduce with smoke scripts.

## Symptom map

### 1) HTTP 400 + `BAD_REQUEST`
Likely diagnostic:
- `VALIDATION_ERROR`

Typical causes:
- missing `evaluated_at`
- invalid request schema
- malformed payload

Actions:
```bash
cd backend
npm run test:phase3
npm run smoke:adaptation-runtime
```

### 2) HTTP 503 + `AUDIT_PERSISTENCE_FAILED`
Likely diagnostic:
- `AUDIT_PERSISTENCE_FAILURE`

Meaning:
- structural mutation path failed audit write and was fail-closed by design.

Actions:
```bash
cd backend
npm run test:phase3
```
Then inspect DB/file persistence availability.

### 3) Runtime boot failure in Postgres mode
Likely diagnostic:
- `CONFIGURATION_ERROR`

Typical causes:
- missing `ADAPTATION_DATABASE_URL`
- dependency install missing (`pg` / `fastify`)

Actions:
```bash
cd backend
npm install
export ADAPTATION_PERSISTENCE_MODE=postgres
export ADAPTATION_DATABASE_URL='postgres://<user>:<pass>@<host>:5432/<db>'
npm run start:adaptation-runtime
```

### 4) Worker returns `status=failed`
Inspect:
- `error_code`
- `diagnostic_code`

Actions:
```bash
cd backend
npm run smoke:adaptation-worker
```

## Database verification commands
```bash
export ADAPTATION_DATABASE_URL='postgres://<user>:<pass>@<host>:5432/<db>'
psql "$ADAPTATION_DATABASE_URL" -c "\d+ adaptation_evaluations"
psql "$ADAPTATION_DATABASE_URL" -c "SELECT count(*) FROM adaptation_evaluations;"
```

## Rollback commands
```bash
cd backend
export ADAPTATION_DATABASE_URL='postgres://<user>:<pass>@<host>:5432/<db>'
npm run db:migrate:adaptation:down
```

## Escalation data to capture
When opening an incident, include:
- timestamp + environment
- persistence mode
- request/job sample payload (redacted)
- `error_code` and `diagnostic_code`
- last 200 log lines around failure
