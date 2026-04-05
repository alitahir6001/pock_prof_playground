# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationObservability.ts`

## Purpose
Provides deterministic diagnostic classification of adaptation errors into a small operational code set.

## Architecture mapping
- Shared observability primitive for framework bindings, worker retry policy, and broker processing.

## Block-by-block walkthrough
1. **Diagnostic code taxonomy**
   - `VALIDATION_ERROR`, `AUDIT_PERSISTENCE_FAILURE`, `CONFIGURATION_ERROR`, `UNKNOWN_ERROR`.
2. **Pattern registries**
   - Validation and config pattern arrays for message-based classification.
3. **Classifier function**
   - Special-cases audit sentinel.
   - Matches configuration patterns.
   - Matches validation patterns.
   - Falls back to unknown.

## Failure modes
- Message-pattern drift can misclassify errors as unknown/retryable.

## Pilot risk level
**Medium**: classification quality directly affects retry/dead-letter behavior.

## Suggested refactor
- Move to typed error classes to reduce brittle message matching.
