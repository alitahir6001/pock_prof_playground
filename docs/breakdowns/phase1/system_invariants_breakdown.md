# Breakdown: `docs/system_invariants_v1.md`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## What this document is
`system_invariants_v1.md` is the non-negotiable safety/behavior contract for runtime behavior. It defines what must always remain true independent of implementation refactors.

## Why this document is critical
Invariants are your stability backbone for micro-pilot. If these drift, pilot outcomes become untrustworthy even if code "works."

## Invariant groups and practical meaning

### 1) Determinism guarantees
- same inputs -> same outputs,
- bounded input contracts,
- deterministic component boundaries.

**Operational meaning:** adaptation outcomes must be reproducible for audit and debugging.

### 2) Structural mutation cap
- defines structural actions,
- enforces weekly hard cap,
- defines deferral behavior.

**Operational meaning:** prevents unsafe over-mutation and preserves learner stability.

### 3) Structural vs non-structural taxonomy
- explicit action classes,
- agent emission prohibitions for direct state mutation.

**Operational meaning:** keeps authority boundaries enforceable and machine-checkable.

### 4) Event immutability contract
- append-only event history,
- versioned schemas,
- evolution rules.

**Operational meaning:** audit replay remains valid across time.

### 5) Adaptation evaluation triggers
- cadence boundaries,
- immediate trigger events,
- window definitions.

**Operational meaning:** ensures evaluation timing is not arbitrary.

### 6) Agent authority boundary
- advisory-only scope,
- no direct mutation authority.

**Operational meaning:** prevents model output from bypassing deterministic policy layer.

### 7) Metric versioning contract
- version naming,
- immutable historical formulas,
- change protocol.

**Operational meaning:** historical metrics remain interpretable after logic updates.

### 8) Failure isolation rules
- schema validation failure handling,
- audit persistence failure behavior,
- metric computation failure isolation.

**Operational meaning:** partial failures should degrade safely and predictably.

### 9) Detected architectural tensions
- acknowledges current tensions/edge conditions.

**Operational meaning:** these become prioritized hardening backlog inputs.

## Mapping to current Phase 3 implementation
- Deterministic policy logic and fail-closed behavior are implemented.
- Structural cap/defer semantics are implemented.
- Observability + retry controls are now present in worker/broker pathways.
- Remaining work: production broker transport and centralized telemetry export.

## Risk assessment before micro-pilot
Risk: **High** (these invariants define trust).
- Any invariant drift can invalidate pilot conclusions.

## Recommended pre-pilot actions
1. Convert each invariant section into executable checks (test/monitor assertions).
2. Add an invariant compliance dashboard (pass/fail by invariant id).
3. Require invariant review in every PR touching adaptation, persistence, or runtime transport.
