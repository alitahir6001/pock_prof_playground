# File Breakdown: `backend/src/modules/adaptation/phase3/policyEngine.ts`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## Purpose
This file is the deterministic adaptation decision engine for Phase 3. It converts validated behavioral counters into ordered mutation actions and deferred actions while enforcing a structural mutation cap.

## Architecture mapping
- Maps to Phase 3 deterministic rule execution in project phase guide.
- Implements policy-level decision logic described by adaptation build slice.

## Block-by-block walkthrough

### Block 1: Engine constants + rule identity
- Declares stable rule IDs (`RULE_IDS`) and structural mutation type set.
- Declares deterministic constants: structural cap and explicit engine version.

Why it matters:
- Stable rule IDs are required for auditability and replay.
- Explicit version allows traceability across behavior changes.

### Block 2: Priority order + typed contracts
- `PRIORITY_ORDER` defines deterministic execution order.
- `CounterInput`, `PolicyInput`, `Mutation`, `PolicyOutput` define strict in/out contracts.

Why it matters:
- Prevents nondeterministic rule ordering.
- Makes downstream persistence and transport contracts predictable.

### Block 3: Helper functions
- `byPriority`: deterministic sorting comparator.
- `assertFiniteNumber`: finite numeric guard.
- `isStructuralMutation`: classifies mutation type.

Why it matters:
- Centralizes critical correctness assumptions.
- Keeps structural-cap logic explicit and testable.

### Block 4: Input validation
- `validateInput` checks required fields, ISO timestamp validity, non-negative weekly structural count, counter shape/type.

Why it matters:
- Fails closed before policy logic executes.
- Prevents unsafe/undefined mutation output on malformed input.

### Block 5: Candidate mutation generation
- Builds candidate mutations for each threshold condition:
  - missed sessions
  - late-night cluster
  - topic resistance
  - pivot interest
  - consecutive completions

Why it matters:
- Encodes behavioral policy in deterministic threshold logic.

### Block 6: Deterministic ordering + structural cap enforcement
- Sorts candidates by priority.
- Computes remaining structural budget from weekly cap.
- Applies or defers structural mutations with `STRUCTURAL_CAP_REACHED` reason.

Why it matters:
- Enforces non-negotiable safety constraint (max structural interventions/week).
- Keeps deterministic behavior under mixed mutation sets.

### Block 7: Output assembly
- Returns `PolicyOutput` with:
  - `engine_version`
  - `evaluated_at`
  - `applied_rules`
  - `mutations`
  - `deferred_mutations`
  - `structural_cap` metadata

Why it matters:
- Produces a fully auditable payload for downstream record builder + persistence.

## Inputs / outputs
## Inputs
- `PolicyInput` (user id, evaluated_at, counters, already-applied structural count).

## Outputs
- `PolicyOutput` deterministic mutation/defer results with cap metadata.

## Failure modes
- Invalid/missing fields -> thrown validation errors.
- Non-finite counters -> thrown numeric validation errors.
- Structural cap exhausted -> structural mutations deferred, not applied.

## Pilot risk assessment
- Risk level: **High** (core decision logic).
- Why high: any bug here affects adaptation quality, user trust, and audit consistency.

## Refactor/polish suggestions before micro-pilot
1. Move threshold values (2/3/5 etc.) into an external config object with versioned snapshots.
2. Add a rule metadata registry for easier explainability and UI/admin introspection.
3. Add property-based tests for ordering + cap invariants under random counter combinations.
4. Add lightweight metrics hooks (rule-hit counts, defer counts) immediately after evaluation.

## Test coverage to review alongside this file
- `backend/tests/adaptation/policyEngine.test.ts`
