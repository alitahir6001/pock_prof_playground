# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationWorkerRetryPolicy.ts`

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
