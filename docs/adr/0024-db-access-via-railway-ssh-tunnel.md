---
status: accepted
date: 2026-11-14
---
# Reach the Railway database through an SSH tunnel, never a public TCP proxy

## Context and Problem Statement
Migrations run from the operator's machine with `psql "$ADAPTATION_DATABASE_URL"` (`backend/package.json`, `db:migrate:*` scripts). Railway's Postgres only has a private-network address by default, with no public connection URL among its variables, so the first deploy needed a way in (`.ai/handoff.md`, deploy notes). Opening a public endpoint was the quick path, but the project had just been moved to a fresh Railway project after a reported security incident on the platform (founder's report, same session).

## Considered Options
* A temporary public TCP proxy on Postgres, deleted after the migrations
* An SSH tunnel via `railway connect Postgres --tunnel-only`, using an SSH key registered with Railway

## Decision Outcome
Chosen option: "An SSH tunnel via `railway connect Postgres --tunnel-only`, using an SSH key registered with Railway", because the database never gets a public address and the same key also opens later debugging sessions. All four migrations were applied this way on 2026-11-14 and checked by listing the resulting tables (`.ai/handoff.md`).

### Consequences
* Good, because Postgres stays reachable only through Railway's private network and authenticated tunnels.
* Good, because the registered key is reusable for `railway ssh` and future database access.
* Bad, because each operator machine needs its own SSH key registered with Railway before it can run migrations.
* Bad, because migrations stay a manual step: open the tunnel, run the `db:migrate:*` scripts against it, close it.

## More Information
Evidence: `backend/package.json` (`db:migrate:*`), `.ai/handoff.md` (deploy notes, 2026-11-14), `docs/railway_pilot_deploy_guide.md` section 3. Related: [ADR-0011](0011-host-on-railway-with-nixpacks.md).
