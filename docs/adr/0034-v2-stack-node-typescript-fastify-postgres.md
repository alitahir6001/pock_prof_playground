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

## Decision Outcome
Chosen option: "Node.js + TypeScript + Fastify, with Postgres for both events and relational data". The Phase 1 plan of 2026-02-22 puts the API layer on "Node.js + Fastify" (`docs/phase1_system_architecture_plan.md:22`), the backend on Node + TypeScript (`:61`), events and relational data in Postgres (`:42-43`), and requires Railway compatibility (`:655`). Firestore was removed from the README roadmap the same day (9725c1e). As built: TypeScript 5.6 strict ESM on Node 20+, Fastify 5, `pg`, hand-written SQL migrations, Node's built-in test runner, Postgres only (`CLAUDE.md:136`, `:155-158`). The plan names the stack but not the reason; the reason is not recorded.

### Consequences
* Good, because Railway runs both Node services and the managed Postgres in one project ([ADR-0011](0011-host-on-railway-with-nixpacks.md)).
* Bad, because no v1 code carried over; the Python code was deleted on 2026-04-05 (08602c6).
* Bad, because there is no ORM: schema changes are hand-written SQL files (`backend/db/migrations/`), applied by hand ([ADR-0024](0024-db-access-via-railway-ssh-tunnel.md)).

## More Information
Evidence: `9725c1e^:readme.md:79-83`, 9725c1e, `docs/phase1_system_architecture_plan.md:22`, `:42-43`, `:61`, `:655`, `CLAUDE.md:136`, `:155-158`, 08602c6. Two parts of the Phase 1 plan were not built as written: the BullMQ queue ([ADR-0037](0037-worker-broker-on-file-queue-defer-production-broker.md)) and a TypeScript frontend ([ADR-0038](0038-v2-frontend-react-vite-jsx-tailwind.md)). Related: [ADR-0036](0036-typed-core-thin-mjs-fastify-shell.md).
