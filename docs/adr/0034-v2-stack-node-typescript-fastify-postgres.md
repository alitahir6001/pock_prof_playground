---
status: accepted
date: 2026-02-22
---
# v2 stack: TypeScript on Node with Fastify and Postgres, replacing Python/FastAPI and the planned Firestore

## Context and Problem Statement
v1 ran FastAPI on Python 3.10+, a plain HTML/CSS/JS frontend, the Gemini API and Railway, with Google Firestore planned for logging quiz interactions (`9725c1e^:readme.md:79-83`). The v2 rebuild ([ADR-0033](0033-rebuild-v2-from-behavioral-spec-in-phases.md)) needed a stack.

## Considered Options
* Keep the v1 stack: Python/FastAPI, with Firestore as the planned database
* Node.js + TypeScript + Fastify, with Postgres for both events and relational data
* Node.js + TypeScript + Express + Prisma + Postgres (the separate POC repo `alitahir6001/pocket_professor_POC`, 65f583a, 2026-02-24)

## Decision Outcome
Chosen option: "Node.js + TypeScript + Fastify, with Postgres for both events and relational data". The Phase 1 plan of 2026-02-22 puts the API layer on "Node.js + Fastify" (`docs/phase1_system_architecture_plan.md:22`), the backend on Node + TypeScript (`:61`), events and relational data in Postgres (`:42-43`), and requires Railway compatibility (`:655`). Firestore was removed from the README roadmap the same day (9725c1e). As built: TypeScript 5.6 strict ESM on Node 20+, Fastify 5, `pg`, hand-written SQL migrations, Node's built-in test runner, Postgres only (`CLAUDE.md:136`, `:155-158`). The plan names the stack but not the reason; the reason is not recorded. Nor is why the POC, two days after the plan, used Express and Prisma, or why v2 then used raw `pg` and no ORM.

How it landed:
* The engine started as plain `.mjs` with a `node --test` suite (03c8c08, 2026-02-25) and moved to strict TypeScript on 2026-03-03 (2a34d0f, bd93df2). Fastify arrived with the runtime wrapper (2fead2d, 2026-03-10). The only runtime dependencies are `fastify` and `pg` (`backend/package.json`).
* `test:phase3` is one hand-listed `node --test` line, so a new test file runs only once it is added there (`backend/package.json`).
* Postgres only: the pilot runtime refuses to start without `DATABASE_URL` (`backend/scripts/run_adaptation_fastify.mjs`). The file adapter of [ADR-0006](0006-adaptation-persistence-adapter-selected-by-env.md) covers only adaptation evaluation records, so the engine runs locally without a database; the app does not.

The POC is the first record of two ideas. Its `BehavioralEvent` table was a per-user log with a free-text `eventType` and a JSON payload, written only by `create` (5ed256c; append-only is inferred from the service, not enforced). That idea was deferred in [ADR-0020](0020-defer-event-journal-rearchitecture-to-phase-4.md) and built, typed, as the student file ([ADR-0046](0046-student-file-append-only-events-table.md)). Its daily `focusScore` (code runs over 10, capped at 1) and `consistencyScore` (1 if any session that day) were not carried over; nothing in the current backend computes them.

### Consequences
* Good, because Railway runs both Node services and the managed Postgres in one project ([ADR-0011](0011-host-on-railway-with-nixpacks.md)).
* Good, because two runtime dependencies leave little to upgrade.
* Bad, because no v1 code carried over; the Python code was deleted on 2026-04-05 (08602c6), including its working AI path and input hardening ([ADR-0032](0032-python-backend-hardening-and-prompt-injection-stance.md)).
* Bad, because there is no ORM: schema changes are hand-written SQL files (`backend/db/migrations/`), applied by hand ([ADR-0024](0024-db-access-via-railway-ssh-tunnel.md)).

## More Information
Evidence: `9725c1e^:readme.md:79-83`, 9725c1e, `docs/phase1_system_architecture_plan.md:22`, `:42-43`, `:61`, `:655`, `CLAUDE.md:136`, `:155-158`, 08602c6; POC repo 65f583a, 5ed256c; 03c8c08, 2a34d0f, bd93df2, 2fead2d, `backend/package.json`. Supersedes [ADR-0032](0032-python-backend-hardening-and-prompt-injection-stance.md). Two parts of the Phase 1 plan were not built as written: the BullMQ queue ([ADR-0037](0037-worker-broker-on-file-queue-defer-production-broker.md)) and a TypeScript frontend ([ADR-0038](0038-v2-frontend-react-vite-jsx-tailwind.md)). Related: [ADR-0036](0036-typed-core-thin-mjs-fastify-shell.md).
