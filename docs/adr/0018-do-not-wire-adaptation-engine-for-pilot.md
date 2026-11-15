---
status: accepted
date: 2026-07-03
---
# Do not wire the adaptation engine for the pilot; leave it in place

## Context and Problem Statement
The adaptation engine ([ADR-0003](0003-deterministic-rule-engine-for-adaptation.md)) is built but unsourced, and no client calls it: `frontend/src` never calls `/adaptation/` (`CLAUDE.md` gotcha 18). The question was whether to wire it before the pilot.

## Considered Options
* Wire the engine for the pilot
* Do not wire it; the founder applies the rules by hand ("Wizard-of-Oz") and those interventions calibrate the thresholds (2026-07-03)
* Delete the engine

## Decision Outcome
Chosen option: "Do not wire it" (9d16f26), so the pilot first tests whether adaptation matters before automating it. Revised 2026-08-13: the engine stays in place, to be read and understood, neither wired nor deleted (c80adb9, `.ai/handoff.md`). The Wizard-of-Oz part was dropped with the paid pilot; see [ADR-0021](0021-n3-unpaid-founder-silent-efficacy-test.md).

### Consequences
* Good, because no unvalidated thresholds drive real users.
* Bad, because over half the backend TypeScript is not in the live path (gotcha 18).

## More Information
Evidence: 9d16f26, c80adb9, gotcha 18, `.ai/handoff.md:10`, `.ai/history.md`. Related: [ADR-0019](0019-paid-founder-run-pilot.md), [ADR-0020](0020-defer-event-journal-rearchitecture-to-phase-4.md). Amended by [ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md): the missed-session rule is wired; the other four stay unwired.
