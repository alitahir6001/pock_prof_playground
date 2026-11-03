---
status: accepted
date: 2026-02-25
---
# A deterministic rule engine decides adaptation; LLMs only advise

## Context and Problem Statement
Pocket Professor adapts a learner's plan to their behavior (missed sessions, late nights, streaks). The question was whether an AI model or a fixed rule set should make those decisions, given they need to be reproducible and auditable.

## Considered Options
* Deterministic, priority-ordered rule engine with injected timestamps and versioned output
* AI-driven adaptation policy (inferred: the alternative `docs/understanding/adaptation-engine.md` argues against under "Why deterministic, not AI?")

## Decision Outcome
Chosen option: "Deterministic rule engine", because identical inputs must give identical outputs so every decision can be audited and explained; AI is reserved for recommendations (`docs/understanding/adaptation-engine.md`, "Key decisions and why"). Timestamps are passed in rather than read from the clock (03c8c08), and evaluator output carries an explicit engine version (cff881f). Full rules: `docs/system_invariants_v1.md` sections 1 and 7.

### Consequences
* Good, because decisions are reproducible and testable without a model call (`CLAUDE.md:177`).
* Bad, because rule thresholds are hand-set and not yet sourced from research (see [ADR-0014](0014-provisional-engine-rule-order-pending-research.md)).

## More Information
Evidence: 03c8c08, cff881f, `CLAUDE.md:177`, `docs/system_invariants_v1.md` §1, §7, `docs/understanding/adaptation-engine.md`. Related: [ADR-0004](0004-fail-closed-structural-mutations-and-append-only-evaluations.md), [ADR-0018](0018-do-not-wire-adaptation-engine-for-pilot.md).
