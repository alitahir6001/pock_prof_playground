# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationBrokerWorker.ts`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## Purpose
Processes broker batches, executes worker jobs, applies retry policy, populates retry/dead-letter queues, and emits aggregate telemetry counters.

## Architecture mapping
- Queue-control runtime boundary for Phase 3 async processing.
- Connects diagnostics, retry policy, and telemetry into one deterministic batch processor.

## Block-by-block walkthrough
1. **Envelope/result types**
   - Defines broker message envelope and batch output shape (`telemetry`, `retry_queue`, `dead_letter_queue`).
2. **Diagnostic normalization**
   - `normalizeDiagnosticCode` validates provided diagnostic codes and falls back to classifier.
3. **Batch processor**
   - Initializes telemetry and queues.
   - Increments total message count.
   - For each message:
     - Runs worker processor.
     - On completed => increments completed metric.
     - On failed => computes retry directive and routes to retry/dead-letter queue with metrics.
   - Catch-path mirrors routing logic for thrown exceptions.

## Failure modes
- Invalid/unknown diagnostics fall back to classification logic (can alter retry decision).
- Upstream worker instability increases dead-letter pressure.

## Pilot risk level
**High**: central reliability surface for async execution and incident handling.

## Suggested refactor
- Emit per-diagnostic metric breakdown to speed root-cause triage.
