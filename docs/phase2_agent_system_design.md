# Phase 2 Agent System Design (Step-by-Step Build Slice)

## Scope of this phase
This phase implements the **agent contract layer** only:
- Agent personality definitions (`soul.md`)
- Agent boundary instructions (`system_instructions.md`)
- Strict output schemas (`output_schema.ts` with Zod)
- Example strict JSON outputs (`example_output.json`)

No adaptation policy code, no persistence implementation, and no API orchestration runtime is included in this phase slice.

## Included agents
1. Onboarding Agent
2. Professor Agent
3. Career Coach Agent

## File locations
- `backend/src/modules/agents/phase2/onboarding-agent/*`
- `backend/src/modules/agents/phase2/professor-agent/*`
- `backend/src/modules/agents/phase2/career-coach-agent/*`

## Contract-level guarantees
- All outputs are JSON-first and schema-bound.
- Agents are advisory only; no direct state mutation.
- No therapy language or diagnostic framing.
- Output payloads are bounded for deterministic downstream mapping.

## How this phase connects to Phase 1
- These files satisfy Phase 2 agent artifact requirements in a way consistent with:
  - `docs/phase1_system_architecture_plan.md`
  - `docs/system_invariants_v1.md`
  - `docs/behavioral_design_v1.md`

## Current conflicts
- No direct conflicts detected in this phase slice.
- Open dependency (not a conflict): runtime orchestration and schema enforcement wiring are deferred to subsequent build slices.

## Rejection-path hardening (Phase 3.5 support)
- Added deterministic agent-output guard validation with explicit reject reasons:
  - `SCHEMA_VALIDATION_FAILED`
  - `UNMAPPED_ACTION`
  - `PROHIBITED_CONTENT`
- Added adversarial tests for:
  - unknown field injection
  - enum spoofing
  - oversized strings
  - cardinality violations
  - prohibited-content patterns

This hardening ensures that `soul.md` tone guidance never substitutes for schema enforcement.
