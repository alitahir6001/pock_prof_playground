---
status: accepted
date: 2026-06-24
---
# Host on Railway: one project, Nixpacks, no Dockerfiles, static frontend via `serve`

## Context and Problem Statement
The pilot (Fastify backend, Vite frontend, Postgres) needed a host. Railway was named as the target in the 2026-05-08 planning sessions (`.ai/history.md`); the deploy config landed on 2026-06-24.

## Considered Options
* Railway with Nixpacks builds
* Dockerfiles (excluded, per the title of 4309cb5)
* SPA-fallback config on the static host (made unnecessary by the `#admin` hash route, `CLAUDE.md` gotcha 17)

## Decision Outcome
Chosen option: "One Railway project, both services built by Nixpacks, no Dockerfiles" (4309cb5; `backend/railway.json`, `frontend/railway.json`). The frontend is served static with `serve -s dist`, and the admin view uses a `#admin` hash route so the host needs no SPA-fallback rule (gotcha 17). Steps: `docs/railway_pilot_deploy_guide.md`.

### Consequences
* Good, because there is no container config to maintain.
* Bad, because `NODE_ENV=production` makes `npm install` skip devDependencies, so builds must use `npm install --include=dev` (gotcha 17).

## More Information
Evidence: 4309cb5, gotcha 17, `docs/railway_pilot_deploy_guide.md`, `.ai/history.md`. Related: [ADR-0017](0017-pilot-on-subdomain-via-cname.md). Supersedes [ADR-0031](0031-host-v1-backend-on-railway.md): v1's backend already ran on Railway from 2025-07-14.
