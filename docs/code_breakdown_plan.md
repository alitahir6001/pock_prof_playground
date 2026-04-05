# Code Breakdown Plan (Line-by-line / Block-by-block)

This document describes a practical way to break down the codebase for micro-pilot readiness and incident response.

## Goal
- Explain what each module does.
- Map each module back to the architecture/phase docs.
- Identify critical paths that can break in pilot.

## Recommended breakdown unit
Use **block-by-block**, not strict line-by-line, for speed and signal.

Suggested block size:
1. File header/import intent.
2. Type/model definitions.
3. Core business functions.
4. Side-effect boundaries (DB/file/network).
5. Error/fail-closed behavior.
6. Test coverage for that file.

## Walk order (highest value first)
1. `backend/src/modules/adaptation/phase3/policyEngine.ts`
2. `backend/src/modules/adaptation/phase3/adaptationEvaluationService.ts`
3. `backend/src/modules/adaptation/phase3/adaptationEvaluationPersistence.ts`
4. adapters:
   - `adaptationEvaluationFileAdapter.ts`
   - `adaptationEvaluationPostgresAdapter.ts`
5. transport/runtime:
   - `adaptationEvaluationEntrypoints.ts`
   - `adaptationFrameworkBindings.ts`
   - runtime scripts in `backend/scripts/`
6. guardrails:
   - `backend/src/modules/agents/phase2/validation/agentOutputGuard.ts`

## Architecture mapping matrix
- Behavioral policy layer (Phase 0/1 intent) -> `policyEngine.ts`
- Adaptation orchestration (Phase 3 service layer) -> `adaptationEvaluationService.ts`
- Audit persistence contract -> `adaptationEvaluationPersistence.ts`
- Concrete persistence infrastructure -> file/postgres adapters
- Transport boundary (HTTP/worker) -> entrypoints + framework bindings
- Runtime shell -> fastify + worker scripts
- Contract safety boundary (Phase 2) -> `agentOutputGuard.ts`

## Deliverable format for each file
For each file produce:
1. **Purpose** (2-3 lines)
2. **Inputs/Outputs**
3. **Dependencies**
4. **Failure modes**
5. **How it maps to architecture docs**
6. **Pilot risk level** (Low/Med/High)
7. **Suggested refactor if any**

## Effort estimate
- Block-by-block deep pass across current backend scope: ~1.5 to 2.5 engineer-days.
- Strict line-by-line with annotations: ~4 to 6 engineer-days.

## Why this is useful before micro-pilot
- Faster debugging under user feedback.
- Cleaner handoffs between product/engineering.
- Better incident response because ownership boundaries become explicit.


## Execution artifacts
- Master checklist: `docs/master_file_breakdown_checklist.md`
- First completed file breakdown: `docs/breakdowns/phase3/policyEngine_breakdown.md`
