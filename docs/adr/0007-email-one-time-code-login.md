---
status: accepted
date: 2026-04-11
---
# Email one-time-code login with hashed codes and tokens and 30-day sessions

## Context and Problem Statement
The pilot needed authentication for non-technical users on phones who may not open the app for weeks.

## Considered Options
* Email one-time code, no password
* OAuth/JWT (shown in the Phase 1 plan, `docs/phase1_system_architecture_plan.md:20`)
* Passwords (rejected in `docs/understanding/auth-sessions.md`, "Why no password?")

## Decision Outcome
Chosen option: "Email one-time code", because passwords add friction and reset-flow support burden for this audience (`docs/understanding/auth-sessions.md`). Codes and session tokens are stored only as SHA-256 hashes; sessions last 30 days (`PILOT_SESSION_TTL_HOURS` default 720, `backend/scripts/run_adaptation_fastify.mjs:19`). Introduced in 6fb57d1.

### Consequences
* Good, because a database read cannot yield working codes or tokens.
* Bad, because login depends on email delivery; the dev-code fallback is local-only and is an auth bypass if enabled in production (`CLAUDE.md` gotcha 14).

## More Information
Evidence: 6fb57d1, gotcha 14, `docs/understanding/auth-sessions.md`, `docs/phase1_system_architecture_plan.md:20`. Amended by [ADR-0036](0036-resend-for-app-email.md) (Resend sends the codes) and [ADR-0043](0043-invite-only-login-allowlist-provider-spend-caps.md) (only allowlisted emails can log in).
