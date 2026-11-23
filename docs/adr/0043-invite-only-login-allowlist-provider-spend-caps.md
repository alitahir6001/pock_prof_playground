---
status: accepted
date: 2026-11-16
---
# Invite-only login through `PILOT_ALLOWED_EMAILS`; cap AI spend at the providers, not in the app

## Context and Problem Statement
Login was open: anyone could request a code ([ADR-0007](0007-email-one-time-code-login.md)). Each request sends an email from the project's domain, and each session can spend AI calls (413feeb). AI spend caps had been a pre-launch item since 2026-07-03 (`.ai/history.md:25`). Smoke-test notes proposed two in-app limits (`962b71d:.ai/handoff.md:48`).

## Considered Options
* Open signup (the behavior when `PILOT_ALLOWED_EMAILS` is unset)
* An email allowlist checked at code request and on every session
* A per-user daily AI call cap
* A 16 KB input limit

## Decision Outcome
Chosen option: "An email allowlist checked at code request and on every session", with provider-side spend caps in place of the two in-app limits. The allowlist is checked before a code is stored or mailed and in `requireSession`, so strangers "cannot make the domain send email or spend AI calls" (413feeb; `backend/src/modules/pilot/emailAllowlist.ts`; gotcha 22c). `ADMIN_EMAIL` is always allowed (413feeb). The per-user cap and input limit were rejected for now as "not needed once the allowlist is set and provider spend caps exist" (`962b71d:.ai/handoff.md:48`). The caps, set 2026-11-18: $20 a month org-wide on OpenAI and on the Anthropic workspace that holds the key; Gemini's is not recorded (`.ai/handoff.md:14`).

### Consequences
* Good, because only invited testers can make the app send mail or call a model.
* Good, because sessions created before the list was set stop working (gotcha 22c).
* Bad, because each tester must be added by their day 0 or they cannot log in, and changing the list restarts the backend (`.ai/handoff.md:16`).
* Bad, because someone who knows a tester's address can still use up that tester's 20 codes a day (`.ai/handoff.md:37`; limits from 899f7cf).
* Bad, because spend is capped per provider account, not per user, so one heavy user could exhaust a month's cap for everyone (inferred).

## More Information
Evidence: 413feeb, 962b71d, 5add55d (allowlist set on prod), 899f7cf, `backend/src/modules/pilot/emailAllowlist.ts`, gotcha 22c, `.ai/history.md:25`, `.ai/handoff.md:14`, `:16`, `:37`. Amends [ADR-0007](0007-email-one-time-code-login.md). Related: [ADR-0009](0009-multi-provider-ai-fallback-via-raw-fetch.md), [ADR-0038](0038-admin-portal-server-enforced-by-admin-email.md).
