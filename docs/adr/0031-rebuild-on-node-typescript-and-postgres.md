---
status: accepted
date: 2026-02-22
---
# Rebuild as a Node/TypeScript backend with a deterministic engine on Postgres, replacing the Python prototype

## Context and Problem Statement
Until February 2026 the app was a Python FastAPI backend that sent one prompt to Gemini and returned a syllabus, with a single-file HTML frontend (`prototype/backend/main.py`, `prototype/frontend/demo_frontend.html`, [ADR-0002](0002-hosted-gemini-api-over-local-ollama.md)). Its roadmap planned to log quiz interactions to Firestore to drive an adaptive engine (`readme.md` before 9725c1e). On 2026-02-22 a behavioral design doc (7ce7b28) and a Phase 1 architecture plan (fa3f780) redefined the product as behavior-driven adaptation. The question was what to build that on.

## Considered Options
* Keep the Python/FastAPI prototype and add Firestore logging (the roadmap item removed in 9725c1e)
* Node.js + TypeScript + Fastify + Postgres + React/TypeScript, with BullMQ for jobs (the Phase 1 plan, fa3f780)
* Node.js + TypeScript + Express + Prisma + Postgres (the separate POC repo, 65f583a, 2026-02-24)

## Decision Outcome
Chosen option: "Node.js + TypeScript + Fastify + Postgres + React/TypeScript, with BullMQ for jobs", built in slices and narrowed on the way (see [ADR-0034](0034-phase-1-plan-cut-to-a-pilot-slice.md)). The reason for leaving Python, and for choosing Fastify over the POC's Express and raw `pg` over Prisma, is not recorded.

How it landed:
* The engine started as plain `.mjs` with a `node --test` suite (03c8c08, 2026-02-25) and moved to strict TypeScript on 2026-03-03 (2a34d0f, bd93df2).
* Fastify arrived with the runtime wrapper (2fead2d, 2026-03-10). The only runtime dependencies are `fastify` and `pg` (`backend/package.json`).
* The frontend arrived as React 18 + Vite 5 in JSX, not TypeScript (6fb57d1, 2026-04-11).
* The Python CLI and FastAPI prototype, with the HTML demo, were deleted (08602c6, 2026-04-05).
* Tests use Node's own runner only; `test:phase3` is one hand-listed `node --test` line, so a new test file runs only once it is added there (`backend/package.json`).
* Postgres is the only database. The pilot runtime refuses to start without `DATABASE_URL` (`backend/scripts/run_adaptation_fastify.mjs`). The file adapter of [ADR-0006](0006-adaptation-persistence-adapter-selected-by-env.md) covers only adaptation evaluation records, so local runs of the engine need no database; the app itself does.

The POC is the first record of two ideas. Its `BehavioralEvent` table was a per-user log with a free-text `eventType` and a JSON payload, written only by `create` (5ed256c; append-only is inferred from the service, not enforced). That idea was deferred in [ADR-0020](0020-defer-event-journal-rearchitecture-to-phase-4.md) and built, typed, as the student file ([ADR-0036](0036-student-file-append-only-event-log.md)). Its daily `focusScore` (code runs over 10, capped at 1) and `consistencyScore` (1 if any session that day) were not carried over; nothing in the current backend computes them.

### Consequences
* Good, because the engine is pure TypeScript that is unit-tested with injected timestamps ([ADR-0003](0003-deterministic-rule-engine-for-adaptation.md)).
* Good, because two runtime dependencies leave little to upgrade.
* Bad, because the Python prototype's working AI path and its input hardening ([ADR-0030](0030-python-backend-hardening-and-prompt-injection-stance.md)) were dropped and AI was rebuilt later ([ADR-0009](0009-multi-provider-ai-fallback-via-raw-fetch.md)).
* Bad, because the frontend is JSX, not the TypeScript the plan named, and has no automated tests.

## More Information
Evidence: 7ce7b28, fa3f780, 9725c1e (2026-02-22); POC repo `alitahir6001/pocket_professor_POC` 65f583a, 5ed256c (2026-02-24); 03c8c08, 2a34d0f, bd93df2, 2fead2d, 08602c6, 6fb57d1; `docs/phase1_system_architecture_plan.md` §1 to §4; `backend/package.json`; `CLAUDE.md` "Tech Stack". Supersedes [ADR-0030](0030-python-backend-hardening-and-prompt-injection-stance.md).
