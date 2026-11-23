---
status: accepted
date: 2026-06-14
---
# Production security guards keyed on `NODE_ENV=production`, fail-closed by default

## Context and Problem Statement
Before the first deploy, a security pass of the pilot backend found that it was built for local use (`.ai/history.md`, session 7; finding labels C1, C3 and M1 in `backend/scripts/run_adaptation_fastify.mjs`). The login code was returned in the API response whenever email was not delivered, so any email misconfiguration in production let anyone log in as anyone, the admin included (`CLAUDE.md` gotcha 14). The question was how to make production safe without breaking local development and its smoke scripts.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: guards that switch on with `NODE_ENV=production` or with an explicit flag, and that fail closed when their setting is missing. Built in the session 7 security pass (2026-06-13 to 14), committed in 8195b42 (2026-06-24); the last item in c30d0fd (2026-11-16).

* **Login `dev_code`** is returned only when `PILOT_EXPOSE_DEV_CODE=true` and the email was not delivered; failed delivery alone no longer returns it (gotcha 14). Never set in production.
* **CORS:** boot refuses to start in production when `FRONTEND_ORIGIN` is `*` or unset (unset defaults to `*`) (gotcha 15). The one allowed origin is in [ADR-0023](0023-pilot-address-learn-pakfro-dev.md).
* **`/adaptation/evaluate`** requires `ADAPTATION_INTERNAL_TOKEN` in production and is disabled when it is unset; locally it stays open so its smoke passes (gotcha 15).
* **Admin** is a normal login whose email equals `ADMIN_EMAIL`, checked on the server for every admin request; unset means nobody is admin (gotcha 16).
* **Login codes** come from `crypto.randomInt`, not `Math.random` (gotcha 16).
* **Browser headers** on the static frontend: a Content-Security-Policy whose `connect-src` names the backend URL, plus frame denial, `nosniff`, a referrer policy and HSTS (`frontend/public/serve.json`, c30d0fd, gotcha 23(c)).

### Consequences
* Good, because a missing setting in production locks a feature rather than opening it.
* Good, because local runs and smoke scripts work unchanged.
* Bad, because every guard depends on `NODE_ENV=production` being set on Railway, and that setting makes `npm install` skip devDependencies (gotcha 17).
* Bad, because the CSP names the backend URL, so a backend domain change blocks every API call until `serve.json` is updated, and `npm run dev` does not apply the file (gotcha 23(c)).
* Bad, because without a working email provider nobody can log in in production.

## More Information
Evidence: 8195b42, c30d0fd, `backend/scripts/run_adaptation_fastify.mjs` (the `isProd` checks), `frontend/public/serve.json`, `.ai/history.md` session 7, `CLAUDE.md` gotchas 5, 14, 15, 16, 17, 23(c). Login lockout and the email allowlist are in [ADR-0039](0039-login-abuse-controls-and-email-allowlist.md). Related: [ADR-0007](0007-email-one-time-code-login.md), [ADR-0011](0011-host-on-railway-with-nixpacks.md).
