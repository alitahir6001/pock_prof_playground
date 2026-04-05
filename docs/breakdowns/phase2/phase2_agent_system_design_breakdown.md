# Breakdown: `docs/phase2_agent_system_design.md`

## What this document is
This Phase 2 design document defines the **agent contract layer** for Pocket Professor: persona intent (`soul.md`), execution boundaries (`system_instructions.md`), strict output schemas (`output_schema.ts`), and canonical payload examples (`example_output.json`).

It is intentionally a constrained slice: no persistence, no adaptation-policy engine, and no runtime orchestration logic.

## How to read it effectively
Read this doc as a **safety + interoperability contract** between:
1. agent prompting artifacts,
2. schema validation/guard logic, and
3. downstream deterministic adaptation services.

The key test is not “does the agent sound good,” but “can every output be machine-validated and safely mapped without ambiguity?”

## Section-by-section breakdown

### 1) Scope of this phase
Declares the boundary: contract artifacts only.

**Importance:** prevents architecture drift where model behavior or runtime concerns are quietly coupled into persona artifacts.

### 2) Included agents
Lists Onboarding, Professor, and Career Coach agents.

**Importance:** defines who participates in Phase 2 contract guarantees and who must share compatibility assumptions.

### 3) File locations
Pins implementation locations under `backend/src/modules/agents/phase2/*`.

**Importance:** this is the traceability seam for audits and future refactors; contract governance depends on predictable artifact paths.

### 4) Contract-level guarantees
States JSON-first outputs, advisory-only behavior, prohibition on therapy/diagnostic framing, and bounded payload structure.

**Importance:** this converts behavioral and legal/product constraints into enforceable technical requirements.

### 5) Connection to Phase 1
Explicitly maps Phase 2 agent contracts back to:
- `docs/phase1_system_architecture_plan.md`
- `docs/system_invariants_v1.md`
- `docs/behavioral_design_v1.md`

**Importance:** keeps agent behavior aligned with system invariants rather than free-form prompt evolution.

### 6) Current conflicts
Notes no direct conflicts, while acknowledging deferred runtime wiring.

**Importance:** distinguishes true contradictions from planned sequencing dependencies.

### 7) Rejection-path hardening (Phase 3.5 support)
Defines deterministic reject reasons:
- `SCHEMA_VALIDATION_FAILED`
- `UNMAPPED_ACTION`
- `PROHIBITED_CONTENT`

And adversarial test classes (field injection, enum spoofing, size/cardinality violations, prohibited content).

**Importance:** this is the fail-closed layer that protects adaptation/runtime surfaces from unsafe or malformed agent output.

## Mapping to implementation status
- Contract artifacts exist for all three agents (`soul.md`, `system_instructions.md`, `output_schema.ts`, `example_output.json`).
- Validation hardening exists via `backend/src/modules/agents/phase2/validation/agentOutputGuard.ts` and its tests.
- Runtime invocation, queueing behavior, and policy/persistence handling are intentionally external to this phase and covered by Phase 3 modules.

## Micro-pilot implications
Risk: **Medium**.

Strengths:
- clear contract boundaries,
- deterministic rejection taxonomy,
- adversarial test mindset.

Remaining risks:
- schema/version drift between agent artifacts and runtime consumers,
- inconsistent prompt updates without synchronized schema review,
- insufficient observability tying reject reasons to product UX paths.

## Recommended pre-pilot actions
1. Add a single machine-readable **agent contract version manifest** spanning all three agents.
2. Require CI checks that diff prompt artifacts and fail if schema/version metadata is not updated.
3. Emit reject-reason metrics (`SCHEMA_VALIDATION_FAILED`, `UNMAPPED_ACTION`, `PROHIBITED_CONTENT`) into centralized adaptation telemetry dashboards.
4. Add golden end-to-end fixtures showing raw model output -> guard decision -> normalized downstream payload mapping.
