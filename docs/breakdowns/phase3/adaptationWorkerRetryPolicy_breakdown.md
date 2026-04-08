# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationWorkerRetryPolicy.ts`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## Purpose
Converts diagnostic code + attempt metadata into deterministic retry directives for worker/broker flows.

## Architecture mapping
- Policy bridge between observability classification and queue-control behavior.

## Block-by-block walkthrough
1. **Retry directive contract**
   - Defines retryability, next attempt, and reason string.
2. **Directive resolution**
   - Stops retry at max attempts.
   - Marks validation/configuration errors non-retryable.
   - Allows retries for unknown/audit persistence failures under max attempts.

## Failure modes
- Incorrect non-retryable mapping may either drop recoverable jobs or cause repeated poison retries.

## Pilot risk level
**Medium-High**: strongly influences queue health and incident load.

## Suggested refactor
- Add backoff metadata (`delay_ms`) into directive to coordinate broker scheduling.
