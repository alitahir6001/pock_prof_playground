# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationEvaluationEntrypoints.ts`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## Purpose
Defines adaptation request schemas, dependency resolution (file/postgres/custom), and API/worker entrypoints over the service layer.

## Architecture mapping
- Transport-agnostic boundary between external callers and adaptation service orchestration.
- Responsible for deterministic request validation and dependency wiring.

## Block-by-block walkthrough
1. **Request + dependency types**
   - `AdaptationEvaluationRequest`, `PersistenceMode`, dependency parameter contracts.
2. **Request validation**
   - `validateRequest` enforces required fields, ISO timestamp, and non-negative structural counters.
3. **Dependency resolution**
   - Supports explicit injected deps (`txFactory` + `repository`) for tests/advanced runtime.
   - Otherwise resolves to postgres/file adapter from mode + required params.
4. **Service mapping helper**
   - `toServiceParams` converts request/deps into service input.
5. **API entrypoint**
   - Executes service cycle and maps structural audit sentinel to deterministic error payload.
6. **Worker entrypoint**
   - Wraps API flow and emits normalized worker completion payload.

## Failure modes
- Partial dependency injection -> explicit config error.
- Missing mode-specific config (`postgresPool`, `auditFilePath`) -> explicit config error.
- Validation failures -> thrown and mapped by framework layer.

## Pilot risk level
**High**: this is the first hard validation + wiring boundary.

## Suggested refactor
- Add schema library validation to generate machine-readable field-level errors.
