# File Breakdown: `backend/scripts/run_adaptation_worker.mjs`

## Layman translation
### Here's what it means in plain terms
- This script runs one worker job message and returns a deterministic success/failure envelope.

### Why it's built
- It provides a command-line worker runtime for local queue processing and controlled retries.

### How it helps a service worker switch careers
- It keeps background adaptation jobs reliable, so learner plans still update even when processed async.

## What this file does
- Reads worker job JSON from env and validates required fields.
  - **In plain English:** won't process malformed jobs silently.
- Supports both persistence modes and optional Postgres connection.
  - **In plain English:** same worker flow works in local and db-backed setups.
- Adds idempotency file store to avoid duplicate completed processing.
  - **In plain English:** repeat messages won't re-apply completed work.
- Calls `handleAdaptationWorkerMessage` and emits JSON response.
  - **In plain English:** normalizes worker output into one predictable format.
- Uses retry policy + diagnostic classification to set exit behavior.
  - **In plain English:** tells orchestration when to retry versus stop.
