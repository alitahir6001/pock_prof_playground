# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationEvaluationPersistence.ts`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## Purpose
Defines transaction/repository persistence contracts and implements fail-closed persistence behavior for structural mutations.

## Architecture mapping
- Audit persistence contract layer used by both file and Postgres adapters.
- Centralized transaction semantics for consistency across adapters.

## Block-by-block walkthrough
1. **Type contracts**
   - `AdaptationEvaluationRecord` defines canonical persistence payload.
   - `PersistenceTransaction`, `TransactionFactory`, `AdaptationEvaluationRepository` abstract storage implementation.
2. **Sentinel constant**
   - `AUDIT_PERSISTENCE_FAILED` standardizes fail-closed error signaling.
3. **Persistence helper (`persistAdaptationEvaluationOrThrow`)**
   - Begins transaction.
   - Inserts evaluation record.
   - Commits on success.
   - Attempts rollback on failure.
   - If evaluation includes structural mutation, throws sentinel regardless of underlying cause.
   - Otherwise rethrows original error.

## Failure modes
- `begin`/`insert`/`commit` failure -> rollback best-effort.
- Rollback failure is swallowed to preserve deterministic outward behavior.

## Pilot risk level
**High**: this enforces core safety semantics for structural changes.

## Suggested refactor
- Include original cause metadata alongside sentinel via typed error object.
