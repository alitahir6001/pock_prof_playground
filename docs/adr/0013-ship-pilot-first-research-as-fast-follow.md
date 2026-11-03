---
status: accepted
date: 2026-06-12
---
# Ship the pilot first; behavioral research is a fast-follow; minimal pilot logging

## Context and Problem Statement
The behavioral rules behind the engine and agents are not yet backed by sourced research. The question was whether to research before shipping or ship on the current agents.

## Considered Options
* Research first
* Ship first, research as a fast-follow

## Decision Outcome
Chosen option: "Ship first", because the agents already produce safe output (the guard blocks the harmful failure mode) and the pilot's goals (guidance trusted, users return, personalization feels real) are answerable with what exists. Logging stays at the existing tables; the rich event taxonomy is a documented future step. Full record: `.ai/behavioral-science-and-engine-alignment.md:29-48`.

### Consequences
* Good, because research does not block real user signal.
* Bad, because the pilot runs on unsourced thresholds.

## More Information
Evidence: `.ai/behavioral-science-and-engine-alignment.md:29-48`. Related: [ADR-0014](0014-provisional-engine-rule-order-pending-research.md), [ADR-0015](0015-career-switch-as-mode-on-general-engine.md).
