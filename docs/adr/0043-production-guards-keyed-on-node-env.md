---
status: accepted
date: 2026-06-14
---
# Production guards switch on with `NODE_ENV=production`; local dev stays open

## Context and Problem Statement
A pre-deploy security pass on 2026-06-14 found three problems: the login code was returned whenever email delivery failed (finding C1), wildcard CORS was allowed (C3), and `/adaptation/evaluate` was open (M1) (`.ai/history.md:33`, gotchas 14, 15). The local smoke scripts rely on the open behavior (gotcha 15). The question was how to lock production down without breaking local runs.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: "Key the guards on `NODE_ENV=production`, with explicit opt-ins for local dev". In production the server refuses to boot when `FRONTEND_ORIGIN` is `*`, which is also its value when unset (`backend/scripts/run_adaptation_fastify.mjs:27`, `:70-74`). `/adaptation/evaluate` is disabled unless `ADAPTATION_INTERNAL_TOKEN` is set (`:41-43`). The login code is returned only when `PILOT_EXPOSE_DEV_CODE=true`, never because delivery failed (`:37-40`, gotcha 14). Shipped in 8195b42.

### Consequences
* Good, because one variable turns on every production guard, and the local smoke scripts pass unchanged (gotcha 15).
* Bad, because forgetting `NODE_ENV=production` on Railway leaves every guard off (gotcha 15).
* Bad, because `NODE_ENV=production` makes `npm install` skip devDependencies, so both builds need `npm install --include=dev` (gotcha 17, [ADR-0011](0011-host-on-railway-with-nixpacks.md)).
* Bad, because setting `PILOT_EXPOSE_DEV_CODE=true` in production is an auth bypass (gotcha 14, `.ai/handoff.md:28`).

## More Information
Evidence: 8195b42, `backend/scripts/run_adaptation_fastify.mjs:27`, `:37-43`, `:70-74`, gotchas 5, 14, 15, 17, `.ai/history.md:33`. Related: [ADR-0007](0007-email-one-time-code-login.md), [ADR-0023](0023-pilot-address-learn-pakfro-dev.md), [ADR-0042](0042-admin-portal-server-enforced-by-admin-email.md).
