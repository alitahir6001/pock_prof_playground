---
status: accepted
date: 2026-03-03
---
# Structural mutations fail closed and are capped; evaluations are append-only

## Context and Problem Statement
Some engine actions (curriculum recalculation) change a learner's path in a large way. If such a change commits but its audit record does not, the system loses the record of why it changed.

## Considered Options
* Fail closed: no structural mutation commits without a persisted audit record
* Apply the mutation even if the audit write fails (the opposite trade-off, rejected in `docs/understanding/adaptation-engine.md`: "A missed change is safer than an unaudited one.")

## Decision Outcome
Chosen option: "Fail closed", with a hard cap of one structural mutation per user per week and append-only evaluation records. Fail-closed persistence was wired with tests in bd93df2. Full rules: `docs/system_invariants_v1.md` §2, §4, §8.2.

### Consequences
* Good, because every committed path change has an audit record (`CLAUDE.md:178`).
* Good, because the weekly cap limits plan churn for the learner (`docs/understanding/adaptation-engine.md`).
* Bad, because a persistence outage blocks legitimate structural changes.

## More Information
Evidence: bd93df2, `CLAUDE.md:178-179`, `docs/system_invariants_v1.md` §2, §4, §8.2, `docs/understanding/adaptation-engine.md`. Related: [ADR-0003](0003-deterministic-rule-engine-for-adaptation.md), [ADR-0006](0006-adaptation-persistence-adapter-selected-by-env.md).
