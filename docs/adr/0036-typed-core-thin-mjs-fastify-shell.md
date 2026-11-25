---
status: accepted
date: 2026-03-10
---
# Keep logic in typed, tested TypeScript modules; the server is a thin plain-`.mjs` Fastify shell

## Context and Problem Statement
The engine's entrypoints were written without a web framework. A binding module takes plain request objects and returns status and JSON (c8faa06, `backend/src/modules/adaptation/phase3/adaptationFrameworkBindings.ts`). They needed a real HTTP server ([ADR-0034](0034-v2-stack-node-typescript-fastify-postgres.md) chose Fastify).

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: "A plain-JavaScript Fastify script that imports the compiled TypeScript from `dist/`" (2fead2d, `backend/scripts/run_adaptation_fastify.mjs`). The pilot routes (auth, agents, plan, admin, student file, nudge) were added to the same script from 6fb57d1 on, and it is the production entrypoint, `start:prod` (gotcha 17). The rule since: logic lives in `backend/src/modules/`, typed and tested; the `.mjs` shell only wires it (gotcha 19). The reason at the time is not recorded. A later skill file gives one: the TypeScript modules are pure and tested, and the server is glue that changed fast during the pilot build (`.claude/skills/pocket-professor-architecture-contract/SKILL.md`, decision 1; its system shape "verified 2026-07-06" at line 12, first committed 2026-08-13 in af26696). The `student/`, `email/` and `pilot/` folders were each added to `backend/tsconfig.json` `include` with their first code (d23e543, 717baf6, 413feeb); a missing entry is how `modules/email/` was found (gotcha 21).

### Consequences
* Good, because the engine does not depend on Fastify and its bindings are unit-tested without a server (`backend/tests/adaptation/adaptationFrameworkBindings.test.ts`).
* Bad, because the shell is untyped and has grown to 822 lines (measured 2026-11-22; 613 on 2026-08-13, gotcha 18), and no unit test imports it; only the smoke scripts exercise it (inferred from `backend/tests/` and `backend/scripts/smoke_*.sh`).
* Bad, because a new TypeScript module must be listed in `backend/tsconfig.json` `include`, or it is not compiled and the shell crashes on import (gotcha 21).

## More Information
Evidence: c8faa06, 2fead2d, 6fb57d1, d23e543, 717baf6, 413feeb, `backend/scripts/run_adaptation_fastify.mjs`, `backend/tsconfig.json`, `.claude/skills/pocket-professor-architecture-contract/SKILL.md`, gotchas 17, 18, 19, 21. Related: [ADR-0034](0034-v2-stack-node-typescript-fastify-postgres.md), [ADR-0037](0037-worker-broker-on-file-queue-defer-production-broker.md).
