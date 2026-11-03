---
status: accepted
date: 2026-03-19
---
# Adaptation persistence behind one adapter interface, file or Postgres chosen by env var

## Context and Problem Statement
Evaluation records must persist (see [ADR-0004](0004-fail-closed-structural-mutations-and-append-only-evaluations.md)). Local development should not require a database; the pilot needs durable storage.

## Considered Options
* File-backed adapter (a12f7d7)
* Postgres adapter (5b6fd01)

Both were built; the decision is to keep both behind one interface.

## Decision Outcome
Chosen option: "One adapter interface, backend selected by `ADAPTATION_PERSISTENCE_MODE`" (`file` for local, `postgres` for pilot), wired in 307d1fb. Both adapters keep the fail-closed semantics (`CLAUDE.md:99-105`). Details: `docs/phase3_adaptation_engine_build_slice.md`.

### Consequences
* Good, because local runs need no database.
* Bad, because two adapters must stay behaviorally identical.

## More Information
Evidence: a12f7d7, 5b6fd01, 307d1fb, `CLAUDE.md:99-105`, `docs/phase3_adaptation_engine_build_slice.md`.
