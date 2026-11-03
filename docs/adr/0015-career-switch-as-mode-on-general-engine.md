---
status: accepted
date: 2026-06-12
---
# Career-switch is a mode on a general learning engine; no new modes during the pilot

## Context and Problem Statement
Most of the behavioral principles and the Professor agent are topic-agnostic; only onboarding and the Career Coach are career-specific (`.ai/product-direction-multi-mode-learning.md:14-21`). The question was whether to add a general skill-learning mode now.

## Considered Options
* Build a skill-learning mode now
* Keep the architecture mode-ready, add no modes until the career-switch wedge is validated

## Decision Outcome
Chosen option: "Mode-ready, no new modes during the pilot", because adding modes to the pilot is scope creep against the ship-first decision, and widening later is additive (`.ai/product-direction-multi-mode-learning.md:37-42`). Deferred, not rejected.

### Consequences
* Good, because the pilot keeps one sharp wedge.
* Bad, because new work must avoid baking career assumptions deeper (`.ai/product-direction-multi-mode-learning.md:40`).

## More Information
Evidence: `.ai/product-direction-multi-mode-learning.md:3`, `:37-42`. Related: [ADR-0010](0010-narrow-wedge-service-workers-it-support-track.md), [ADR-0013](0013-ship-pilot-first-research-as-fast-follow.md).
