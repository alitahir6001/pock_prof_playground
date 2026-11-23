---
status: accepted
date: 2026-03-10
---
# The server is a plain `.mjs` shell that imports compiled TypeScript from `dist/`; logic lives in typed, tested modules

## Context and Problem Statement
The engine and agent code were strict TypeScript with unit tests ([ADR-0031](0031-rebuild-on-node-typescript-and-postgres.md)). Something had to run them as an HTTP server and workers. The question was whether that runner is part of the TypeScript build.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: hand-written ES-module scripts in `backend/scripts/` that import the compiled output, starting with `run_adaptation_fastify.mjs` (25 lines, 2fead2d, 2026-03-10). The reason at the time is not recorded. A later skill file gives one: the TypeScript modules are pure and tested, and the server is glue that changed fast during the pilot build (`.claude/skills/pocket-professor-architecture-contract/SKILL.md`, decision 1, written 2026-07-06).

The rule that follows, as practised since 2026-11-15:
* New logic goes into a typed, tested module under `backend/src/modules/` (`student/`, `email/`, `pilot/`), and the shell only wires routes, SQL and env to it (`CLAUDE.md` gotcha 19).
* A module is compiled only if its folder is in `backend/tsconfig.json` `include`. A missing folder means no file in `dist/`, and the server crashes on import at boot. That is how `modules/email/` was found missing (gotcha 21); `student/`, `email/` and `pilot/` were each added with their first code (d23e543, 717baf6, 413feeb).

### Consequences
* Good, because the logic that decides things is strict TypeScript with unit tests.
* Bad, because the shell itself has no unit tests; it is checked by smoke scripts and curl, and has grown to 822 lines with inline SQL (`wc -l`, 2026-11-22; gotcha 18 counted 613).
* Bad, because a forgotten `include` entry passes the build and fails only at boot.

## More Information
Evidence: 2fead2d, 6fb57d1 (pilot routes added to the shell), d23e543, 717baf6, 413feeb, `backend/scripts/run_adaptation_fastify.mjs`, `backend/tsconfig.json`, `CLAUDE.md` gotchas 17, 18, 19, 21. The production start command runs this shell directly (`start:prod`, gotcha 17).
