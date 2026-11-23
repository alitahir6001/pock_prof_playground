---
status: accepted
date: 2026-06-14
---
# Founder-only admin portal: a normal login, checked on the server against `ADMIN_EMAIL`, fail-closed

## Context and Problem Statement
During the pilot the founder needs to see the cohort, "to know who to nudge" (`.ai/history.md:33`). The question was how to restrict that view to the founder.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: "A normal pilot login, authorized on the server when the session's email equals `ADMIN_EMAIL`". `requireAdmin` wraps `requireSession` and returns 403 for any other email (`backend/scripts/run_adaptation_fastify.mjs:199-207`). If `ADMIN_EMAIL` is unset, no one is admin, and there is no static admin token to leak (`:30-32`). The UI is the `#admin` hash route (`AdminPortal`, ed724be), so the static host needs no SPA fallback ([ADR-0011](0011-host-on-railway-with-nixpacks.md)). Built in 8195b42 and ed724be (gotcha 16). The student-file read, `GET /pilot/admin/student-file` (1b0fb29), uses the same gate.

### Consequences
* Good, because the gate is on the server: knowing the `#admin` route grants nothing (gotcha 16).
* Good, because the founder logs in like any tester, with no second credential to manage (gotcha 16).
* Bad, because `ADMIN_EMAIL` is always allowed past the login allowlist (413feeb, [ADR-0043](0043-invite-only-login-allowlist-provider-spend-caps.md)), so admin access rests on that one mailbox (inferred).
* Bad, because the student-file route takes the tester's email in the URL, so it appears in request logs (`.ai/handoff.md:37`).

## More Information
Evidence: 8195b42, ed724be, 1b0fb29, 413feeb, `backend/scripts/run_adaptation_fastify.mjs:30-32`, `:199-207`, gotcha 16, `.ai/history.md:33`, `.ai/handoff.md:37`. Related: [ADR-0007](0007-email-one-time-code-login.md), [ADR-0039](0039-production-guards-keyed-on-node-env.md).
