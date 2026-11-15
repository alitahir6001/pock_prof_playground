---
status: accepted
date: 2026-07-12
---
# Defer the event-journal / deterministic-tick / replay re-architecture to Phase 4

## Context and Problem Statement
An append-only event journal with a deterministic tick and replay was proposed as the engine's next design. The question was whether to pause the pilot to build it.

## Considered Options
* Re-architect before the pilot
* Defer to Phase 4 and keep the pilot moving

## Decision Outcome
Chosen option: "Defer to Phase 4", because the change is invisible at zero users and the redesign needs pilot data more than the pilot needs the redesign (`.ai/history.md`, session 9; af26696 lists it as "deliberately deferred; never pre-pilot"). Restated 2026-08-13 (c80adb9, `.ai/handoff.md:10`).

### Consequences
* Good, because the pilot is not delayed.
* Bad, because the per-user event log that `.ai/vision.md` names as build-order step 1 ("Student file") does not exist yet.

## More Information
Evidence: af26696, c80adb9, `.ai/handoff.md:10`, `.ai/history.md`, `.ai/vision.md` "Build order" step 1. Amended by [ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md): the per-user event log is built before the test; deterministic tick and replay stay deferred to Phase 4.
