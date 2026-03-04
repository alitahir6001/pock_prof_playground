# Phase 3 Adaptation Engine Build Slice (Initial)

## Scope delivered in this slice
This slice starts Phase 3 with a deterministic adaptation evaluator module and runnable rule tests. Evaluations now require caller-supplied `evaluated_at` timestamps to avoid runtime time-source nondeterminism.

### Implemented artifacts
- `backend/src/modules/adaptation/phase3/policyEngine.ts`
- `backend/src/modules/adaptation/phase3/adaptationEvaluationRecord.ts`
- `backend/src/modules/adaptation/phase3/adaptationEvaluationService.ts`
- `backend/src/modules/adaptation/phase3/adaptationEvaluationFileAdapter.ts`
- `backend/tests/adaptation/policyEngine.test.ts`
- `backend/package.json` (test script for this slice)

## Deterministic rule coverage in code
Implemented required rule examples:
1. If 2 missed sessions in 7 days → reduce workload 25%
2. If 3 late-night sessions logged → shift suggested schedule
3. If topic resistance signal triggered → call Career Coach Agent
4. If pivot interest triggered → recalculate curriculum graph
5. If 5 consecutive completed sessions → increase difficulty slightly

## Output contract (engine)
Input requires:
- `user_id`
- `evaluated_at` (valid ISO timestamp string)
- windowed counter object

The evaluator returns:
- `engine_version` (explicit evaluator version tag)
- `evaluated_at`
- `applied_rules`
- `mutations` with:
  - `rule_id`
  - `trigger_window`
  - `events_used`
  - `mutation_applied`

## Structural mutation cap behavior
- Structural mutation type(s) are explicitly classified.
- Weekly structural cap is enforced in evaluator output: `max 1`.
- Structural mutations beyond cap are returned in `deferred_mutations` with `STRUCTURAL_CAP_REACHED`.
- Non-structural mutations continue to apply in the same run.

## Persistence adapter + transactional wiring
- `buildAdaptationEvaluationRecord` prepares a DB-ready payload aligned to `adaptation_evaluations` architecture fields.
- `persistAdaptationEvaluationOrThrow` now wires transaction lifecycle (`begin -> insert -> commit`) via injected repository/transaction interfaces.
- Structural mutations are fail-closed: persistence write failures raise `AUDIT_PERSISTENCE_FAILED` after best-effort rollback so structural changes cannot proceed without an audit row.
- Non-structural persistence failures rethrow original storage errors after rollback attempt.

## Slice 5 orchestration module
- `runAdaptationEvaluationCycle` composes evaluator -> record builder -> transactional persistence in one deterministic service-level call.
- Service preserves fail-closed semantics by relying on persistence layer `AUDIT_PERSISTENCE_FAILED` behavior for structural mutation write failures.

## Slice A concrete persistence adapter
- Added a concrete file-backed persistence adapter (`adaptationEvaluationFileAdapter.ts`) that satisfies transaction/repository interfaces and writes auditable rows to JSON storage for local development/testing.
- Adapter is intentionally local-first (JSON file) to keep infrastructure friction low while preserving transaction semantics and fail-closed structural behavior.

## Current conflicts
- No conflict with behavioral principles or phase architecture detected.
- Determinism improvement applied: evaluator no longer uses `new Date()` internally and fails closed on invalid inputs.
- Remaining gap: production-grade DB adapter (Postgres/Firebase/etc.) is still pending; current concrete adapter is file-backed for local/pilot plumbing.
- Remaining gap: API/worker entrypoints are not wired yet (service is currently module + tests).
- TypeScript migration completed for Phase 3 evaluator, persistence modules, orchestration service, and slice tests.
