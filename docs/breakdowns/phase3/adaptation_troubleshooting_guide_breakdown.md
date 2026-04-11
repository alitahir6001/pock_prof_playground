# File Breakdown: `backend/docs/adaptation_troubleshooting_guide.md`

## Layman translation
### Here's what it means in plain terms
- This guide maps common runtime problems to likely causes and immediate fixes.

### Why it's built
- It speeds incident triage and reduces guesswork during failures.

### How it helps a service worker switch careers
- Faster recovery means fewer interruptions when learners need dependable daily guidance.

## What this file does
- Defines diagnostic code model (`VALIDATION_ERROR`, `AUDIT_PERSISTENCE_FAILURE`, `CONFIGURATION_ERROR`, `UNKNOWN_ERROR`).
  - **In plain English:** gives teams a shared failure vocabulary.
- Provides symptom-to-action playbooks for HTTP 400/503, boot failures, worker failures, duplicate replay, DB checks, rollback steps.
  - **In plain English:** gives specific next commands for each common failure mode.
- Lists escalation data to capture during incidents.
  - **In plain English:** ensures support tickets include enough context to solve issues quickly.
