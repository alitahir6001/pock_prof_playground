---
status: accepted
date: 2026-06-14
---
# Login abuse limits: count each guess before judging it, and throttle code requests per email under a lock

## Context and Problem Statement
Login is a 6-digit emailed code ([ADR-0007](0007-email-one-time-code-login.md); `randomInt(100000, 1000000)` in `backend/scripts/run_adaptation_fastify.mjs`). A 6-digit code can be guessed, and the request endpoint can be made to send many codes to one address. The pre-deploy security pass flagged brute force as finding C2 (migration 004). The question was how to bound guesses and code emails per address.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: per-email limits stored in `pilot_login_codes`, with the numbers in `backend/src/modules/pilot/loginLimits.ts`. The lockout came first (8195b42, migration `20260614_004_login_code_attempts`); the lockout was fixed and the throttle added in the 2026-11-16 security pass (gotcha 23).

* **Lockout on verify:** at most 8 wrong codes per email within one code lifetime (`PILOT_LOGIN_CODE_TTL_MINUTES`, default 15), summed across that email's codes so requesting a fresh code cannot reset the count; past it, 429 (gotcha 14).
* **Count before judging:** each verify adds its attempt first and then checks the total. The original check-then-count let parallel guesses through, measured locally at 12 to 49 against a limit of 8 (ff6b057, gotcha 23(a)). A correct code hands its increment back, and claiming a code is one statement, so a code cannot log in twice.
* **Request throttle:** at most 5 codes per email per code lifetime and 20 per 24 hours, counted inside a transaction holding `pg_advisory_xact_lock(hashtext(email))`, because without the lock a burst outruns the count (899f7cf, gotcha 23(b)).
* Who may log in at all is a separate control, `PILOT_ALLOWED_EMAILS` ([ADR-0049](0049-invite-only-login-allowlist-provider-spend-caps.md)). `NUDGE_ALLOWLIST` is unrelated to login: it only limits who receives real nudge email ([ADR-0028](0028-nudge-stop-link-confirms-on-the-frontend.md)).

### Consequences
* Good, because guesses per address are bounded even under parallel requests.
* Good, because one address cannot be flooded with code emails.
* Bad, because someone who knows a tester's address can use up that tester's 20 codes a day, or lock them out with 8 bad guesses for one code lifetime (`.ai/handoff.md:37`; the second is inferred from the limits).
* Bad, because both limits were measured locally only, not under load on production (`.ai/handoff.md:37`).

## More Information
Evidence: 8195b42, ff6b057, 899f7cf, migration `20260614_004_login_code_attempts.up.sql`, `backend/src/modules/pilot/loginLimits.ts`, `backend/scripts/run_adaptation_fastify.mjs` (verify and request routes), `CLAUDE.md` gotchas 14, 23(a), 23(b), `.ai/handoff.md:37`. Related: [ADR-0043](0043-production-guards-keyed-on-node-env.md).
