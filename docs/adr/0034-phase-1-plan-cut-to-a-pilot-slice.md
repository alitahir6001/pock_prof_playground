---
status: accepted
date: 2026-04-11
---
# Ship a pilot slice of the Phase 1 plan; defer the graph, market gap and freemium, replace BullMQ and OAuth

## Context and Problem Statement
The Phase 1 plan (fa3f780, 2026-02-22) is a "3-Month Scope" design: React/TS frontend, OAuth/JWT, an entitlement middleware with billing, a curriculum and certification skill graph, a market-gap service, a BullMQ job queue, an agent orchestrator with four agents including a Resilience Coach, and a Postgres event store (`docs/phase1_system_architecture_plan.md` §1, §7, §9, §10). By the first pilot build (6fb57d1, 2026-04-11) much less existed. The question was what the pilot ships with.

## Considered Options
* Build the Phase 1 plan as written
* Ship a narrower slice and move the rest to later phases (what the commits show)

## Decision Outcome
Chosen option: "Ship a narrower slice and move the rest to later phases". The reason for the cut is not recorded.

| Plan item | What happened | Status |
|---|---|---|
| Curriculum and certification skill graph | Not built | Deferred to Phase 4 (`docs/project_onboarding_and_phase_guide.md`) |
| Market-gap service | Not built | Deferred to Phase 5 (same doc) |
| Freemium entitlements and billing | Not built | Deferred to Phase 6 (same doc) |
| OAuth/JWT | Email one-time code and opaque session tokens | Replaced ([ADR-0007](0007-email-one-time-code-login.md)) |
| BullMQ job queue | A JSON file-queue worker with retry, dead-letter and idempotency (9937900, 0ec27ef), never deployed; the doc names a real broker (SQS, Rabbit or Redis Streams) as the open gap | Replaced by a simulation, unwired (`docs/phase3_broker_telemetry_slice.md`) |
| Resilience Coach agent | Not built; three agents only | Not scheduled; listed as missing (`.ai/behavioral-science-and-engine-alignment.md`, principle 11) |
| Agent orchestrator | One runner that builds a prompt and falls back across providers | Narrowed (gotcha 18, [ADR-0009](0009-multi-provider-ai-fallback-via-raw-fetch.md)) |
| React + TypeScript frontend | React in JSX | Narrowed ([ADR-0031](0031-rebuild-on-node-typescript-and-postgres.md)) |

### Consequences
* Good, because a pilot shipped without billing, a graph or a queue to run.
* Bad, because the plan doc still describes the larger system, so it reads as current unless checked against the code.
* Bad, because the Resilience layer, which the behavioral doc ranks first, has no phase (`.ai/behavioral-science-and-engine-alignment.md`).

## More Information
Evidence: fa3f780, 9937900, 0ec27ef, 6fb57d1; `docs/phase1_system_architecture_plan.md`, `docs/phase3_broker_telemetry_slice.md`, `docs/project_onboarding_and_phase_guide.md` (Phases 4 to 6), `backend/package.json` (no queue dependency), `CLAUDE.md` gotcha 18. The "never build curriculum" line in `CLAUDE.md` "Honest Assessment" (2026-07-12) sits against the Phase 4 graph; which one holds is not recorded. Related: [ADR-0014](0014-provisional-engine-rule-order-pending-research.md), [ADR-0018](0018-do-not-wire-adaptation-engine-for-pilot.md).
