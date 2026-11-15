---
status: superseded by ADR-0025
date: 2026-08-13
---
# Validate with an n=3 unpaid, founder-silent, 14-day efficacy test

## Context and Problem Statement
The paid pilot ([ADR-0019](0019-paid-founder-run-pilot.md)) put the founder in the loop by design, so a good result could not be attributed to the app. The question it could not answer: does the software alone move someone to act (`.ai/pilot-test-design.md`)?

## Considered Options
* Paid founder-run pilot (ADR-0019)
* n=3 unpaid test with the founder silent

## Decision Outcome
Chosen option: "n=3 silent test", because the founder-in-loop design could not test efficacy. Three unpaid users, 14 days, no founder contact between day 0 and day 14; day 0 pre-registers a specific action each has been stalled on; bar is at least 1 of 3; branch criteria frozen before day 0. Willingness to pay is deferred, as it is downstream of efficacy. Nothing new is built until a result. Protocol: `.ai/pilot-test-design.md`; summary: `CLAUDE.md:26-30`.

### Consequences
* Good, because a positive result is attributable to the software.
* Bad, because n=3 gives a directional signal, not a measurement, and says nothing about willingness to pay.

## More Information
Evidence: af26696, c80adb9, `.ai/pilot-test-design.md`, `CLAUDE.md:26-30`. Supersedes [ADR-0019](0019-paid-founder-run-pilot.md). Also drops the Wizard-of-Oz part of [ADR-0018](0018-do-not-wire-adaptation-engine-for-pilot.md). Scope may change via the open A/B decision in `.ai/vision.md`. Superseded by [ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md).
