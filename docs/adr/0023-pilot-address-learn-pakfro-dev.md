---
status: accepted
date: 2026-11-14
---
# Serve the pilot at `learn.pakfro.dev`, the only origin the backend accepts

## Context and Problem Statement
[ADR-0017](0017-pilot-on-subdomain-via-cname.md) chose a CNAME subdomain but left the name open. After the first Railway deploy the frontend only had a long generated `*.up.railway.app` address, which is hard to type on a phone (`.ai/handoff.md`, Current state). The backend allows exactly one CORS origin, read from `FRONTEND_ORIGIN` (`backend/scripts/run_adaptation_fastify.mjs:18`, `:76`), so whichever address is chosen becomes the only one that can log in.

## Considered Options
* `pp.pakfro.dev`
* `professor.pakfro.dev`
* `learn.pakfro.dev`
* Renaming the Railway-provided subdomain (e.g. `pocket-professor.up.railway.app`), with no DNS work

## Decision Outcome
Chosen option: "`learn.pakfro.dev`", because it was the founder's pick; the option as presented noted it leaves room for the product to grow beyond the Professor role (inferred as the reason). Set up as a Railway custom domain on the frontend service, with a CNAME plus a `_railway-verify` TXT record at the DNS host, and `FRONTEND_ORIGIN=https://learn.pakfro.dev` on the backend (`.ai/handoff.md`).

### Consequences
* Good, because the address is short and sits on the same domain as the login-email sender, as ADR-0017 intended.
* Bad, because the generated Railway frontend URL still loads the page but cannot log in, since CORS allows only `learn.pakfro.dev`.
* Bad, because changing the address later means new DNS records and a matching `FRONTEND_ORIGIN` change, or login breaks.

## More Information
Evidence: `.ai/handoff.md` (Current state, 2026-11-14), `backend/scripts/run_adaptation_fastify.mjs:18`, `:62`, `:76`, `CLAUDE.md` gotchas 5 and 15. Carries out [ADR-0017](0017-pilot-on-subdomain-via-cname.md).
