---
status: accepted
date: 2026-05-08
---
# Narrow wedge: service-industry workers 35+, one IT-support track, no in-house curriculum

## Context and Problem Statement
The product needed a target user and a scope for the pilot. A later evaluation found plan generation is not a moat, since general chat assistants produce plans for free (`CLAUDE.md:17`).

## Considered Options
* Narrow wedge: service-industry workers ~35+, then a single IT-support track
* Top-to-bottom B2B worker-training rebuild (rejected, `CLAUDE.md:24`)
* Generic "AI upskilling app" (rejected, `CLAUDE.md:24`)
* Dropping the idea before any user data (rejected, `CLAUDE.md:24`)

## Decision Outcome
Chosen option: "Narrow wedge". The persona is service-industry workers ~35+ with chaotic schedules (`docs/what-is-pocket-professor.md:18-20`), recorded as the planning target on 2026-05-08 (`.ai/history.md`, sessions 2-3). On 2026-07-12 it narrowed to one track: IT support with CompTIA A+ as the spine and free existing content; the product sells the scaffolding and never builds curriculum (`CLAUDE.md:17`, committed in af26696). Rejected pivots carry their reasons in `CLAUDE.md:24`: long B2B sales cycles, the most crowded framing, and abandoning before data.

### Consequences
* Good, because a sharp persona makes pilot signal interpretable.
* Bad, because onboarding still offers many career domains (86d0c57), an open tension with the single-track decision.

## More Information
Evidence: `docs/what-is-pocket-professor.md:18-20`, `CLAUDE.md:17`, `CLAUDE.md:24`, af26696, 86d0c57, `.ai/history.md`. The same persona already appears in `docs/behavioral_design_v1.md:8` (7ce7b28, 2026-02-22). Related: [ADR-0015](0015-career-switch-as-mode-on-general-engine.md).
