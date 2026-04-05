# Breakdown: `docs/behavioral_design_v1.md`

## What this document is
`behavioral_design_v1.md` is the canonical behavioral rule source for Pocket Professor. It defines mission, non-goals, adaptation principles, event/signal requirements, and trigger rules that every downstream technical system must obey.

## Why this document is critical
- It is the top behavioral authority before architecture and code.
- It constrains what adaptation decisions are allowed.
- It prevents product drift into non-goals (e.g., therapy/gamification framing).

## Section-by-section breakdown

### 1) Mission
Defines target learner profile and optimization goals:
- competence evidence,
- interview readiness,
- resilience/recovery,
- pivot preservation,
- chaos-adaptive planning.

Also explicitly forbids optimization toward streak vanity, dopamine loops, therapy framing, and passive consumption.

**System implication:** any feature request that increases engagement but decreases these mission goals is out-of-scope.

### 2) Core Behavioral Principles
This is the main rules engine spec in plain language.
Each principle defines:
1. behavioral intent,
2. required signals,
3. deterministic trigger rule.

#### Principle pattern (repeated structure)
- **Description**: why this behavior matters.
- **Signals**: measurable event fields required in data model.
- **Rule**: thresholded deterministic action.

This structure is directly translatable into policy-engine rule blocks.

### 3) Principle deep map (operational interpretation)
Below is the practical interpretation of principle groups.

#### Principles 1-4: execution reliability under fatigue
- trigger adherence,
- proof-producing sessions,
- recovery protocol,
- energy-relative load matching.

**Engineering effect:** requires event capture windows + threshold evaluators.

#### Principles 5-8: motivation and recommitment scaffolding
- identity framing with artifacts,
- interview checkpoint framing,
- constrained task-choice UX,
- reset windows.

**Engineering effect:** requires milestone model, task ranking logic, and reset trigger jobs.

#### Principles 9-11: strategic integrity + safety
- pivot overlap preservation,
- directional ambiguity detection,
- anti-shame resilience layer.

**Engineering effect:** requires pivot safety constraints and escalation pathways (coach/agent boundaries).

### 4) Signal contract implications
The document repeatedly encodes required signals (event names + derived metrics). These become hard dependencies for:
- event schema,
- adaptation window computation,
- audit explainability.

Missing signals mean certain principles cannot be enforced deterministically.

### 5) Decision governance implications
Because rules are deterministic and event-derived:
- no hidden LLM-memory state may drive adaptation,
- adaptations must be reconstructable from event history,
- every mutation should be explainable with rule + evidence window.

## Mapping to architecture/code layers
- Maps into Phase 1 architecture sections for events, adaptation components, and agent boundaries.
- Maps into Phase 3 policy engine rules + mutation semantics.
- Maps into system invariants for deterministic and fail-closed behavior.

## Risk assessment before micro-pilot
Risk: **High if misunderstood**.
- If teams treat this as aspirational instead of canonical, implementation drift will happen quickly.

## Recommended pre-pilot actions
1. Add a traceability table: Principle -> Signal(s) -> Rule ID -> Test file.
2. Add explicit “not implemented yet” markers for principles not yet wired in code.
3. Add a changelog/version field to this doc with approval trail.
