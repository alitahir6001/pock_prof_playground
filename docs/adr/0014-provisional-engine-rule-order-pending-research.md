---
status: accepted
date: 2026-06-12
---
# Treat the engine's rule order as provisional; realign to safety-first only after research

## Context and Problem Statement
The engine evaluates topic resistance, then pivot interest, then missed sessions, late night, completions (`CLAUDE.md` gotcha 8). The behavioral design doc puts safety first and pivot last, nearly the inverse, and its thresholds are unsourced (`.ai/behavioral-science-and-engine-alignment.md:74-76`).

## Considered Options
* Align the code to the behavioral doc now
* Keep the code order as provisional until research, then realign to safety-first

## Decision Outcome
Chosen option: "Provisional until research", because aligning code to an unsourced doc before research hardens guesses into code. The target is safety-first triage, with the specific order itself validated by research ("Rules-to-code alignment", `.ai/behavioral-science-and-engine-alignment.md:159-173`). Status: accepted, pending that research.

### Consequences
* Good, because no unvalidated ordering is canonized.
* Bad, because the code order and the design doc stay inconsistent until then.

## More Information
Evidence: gotcha 8, `.ai/behavioral-science-and-engine-alignment.md:74-76`, `:159-173`. Related: [ADR-0003](0003-deterministic-rule-engine-for-adaptation.md), [ADR-0013](0013-ship-pilot-first-research-as-fast-follow.md).
