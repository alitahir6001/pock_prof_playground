# File Breakdown: `backend/scripts/run_adaptation_broker_worker.mjs`

## Layman translation
### Here's what it means in plain terms
- This script processes a batch queue file, then writes retry, dead-letter, and metrics outputs.

### Why it's built
- It simulates a broker loop locally without requiring managed queue infrastructure.

### How it helps a service worker switch careers
- It helps ensure failed adaptation jobs are retried safely instead of being lost.

## What this file does
- Reads queue messages from JSON file and normalizes envelope fields.
  - **In plain English:** turns raw queue records into consistent worker messages.
- Runs `processBrokerBatch` with worker handler integration.
  - **In plain English:** processes each message and decides completed/retry/dead-letter.
- Persists retry queue, DLQ, metrics, and clears queue input file.
  - **In plain English:** leaves explicit artifacts for operators to inspect.
- Supports file/postgres persistence modes and closes pool when used.
  - **In plain English:** works in both local and db-backed environments.
