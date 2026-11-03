---
status: superseded by ADR-0021
date: 2026-07-12
---
# Paid pilot: ~10 users, founder runs the rules by hand, Exit Report, kill criteria

## Context and Problem Statement
A project evaluation found no willingness-to-pay test anywhere in the plan and the engine unwired (af26696, `CLAUDE.md` "Honest Assessment" as committed then).

## Considered Options
* Unpaid pilot (the prior plan)
* Paid pilot

## Decision Outcome
Chosen option: "Paid pilot": ~10 users at $20-25, collected out-of-band with no payments code; the founder applies the 5 engine rules as a manual SOP and records an intervention log; each finisher gets a founder-written day-14 Exit Report; kill criteria written before the first user (af26696). Charging was meant as the commitment filter and the only retention signal that predicts revenue.

### Consequences
* Good, because it would have tested willingness to pay.
* Bad, because a founder-in-the-loop design cannot separate the app's effect from the founder's ([ADR-0021](0021-n3-unpaid-founder-silent-efficacy-test.md)).

## More Information
Evidence: af26696, `.ai/history.md` (session 9). Superseded by [ADR-0021](0021-n3-unpaid-founder-silent-efficacy-test.md).
