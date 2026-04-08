# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationEvaluationService.ts`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## Purpose
Service-layer orchestration for one deterministic adaptation evaluation cycle: evaluate policy, build an audit record, persist atomically, and return API-ready identifiers/output.

## Architecture mapping
- Phase 3 orchestration boundary between policy engine and persistence contracts.
- Keeps transport/runtime adapters free from business sequencing logic.

## Block-by-block walkthrough
1. **Imports and service contracts**
   - Pulls in policy evaluation, record builder, persistence helper, and shared types.
2. **Input/output types**
   - `RunAdaptationEvaluationParams` defines required policy input, trigger window, state snapshots, and persistence dependencies.
   - `RunAdaptationEvaluationResult` standardizes response shape (`policy_output`, `evaluation_id`).
3. **Structural-mutation detector**
   - `hasStructuralMutation` inspects emitted mutations against canonical structural type set.
4. **Main orchestration (`runAdaptationEvaluationCycle`)**
   - Validates top-level params.
   - Runs deterministic policy evaluation.
   - Builds persistence payload with pre/post state.
   - Persists with fail-closed semantics for structural mutations.
   - Returns persisted evaluation id plus policy output.

## Failure modes
- Invalid params -> immediate validation error.
- Downstream persistence failures -> bubbled errors or `AUDIT_PERSISTENCE_FAILED` sentinel (via persistence helper).

## Pilot risk level
**High**: this is the center of policy-to-persistence integrity.

## Suggested refactor
- Add explicit runtime correlation id passthrough for cross-layer tracing.
