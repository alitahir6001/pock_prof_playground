---
status: accepted
date: 2026-04-11
---
# Send all app email through Resend's HTTP API

## Context and Problem Statement
Email one-time-code login ([ADR-0007](0007-email-one-time-code-login.md)) needed an email sender. Later, the daily nudge ([ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md) step 4) needed one too.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: "Resend", introduced with the email login in 6fb57d1 (`docs/understanding/auth-sessions.md:17`). Since step 4, login codes and nudges share one sender, `backend/src/modules/email/sendEmail.ts`, which calls Resend's HTTP API with `fetch` (`sendEmail.ts:25`; 717baf6) and can attach an HTML part (af75ce2). Configuration is `RESEND_API_KEY` plus `RESEND_FROM_EMAIL`, which must match a verified Resend domain (`CLAUDE.md:175-176`). Prod's key is send-only, and the domain's DKIM, SPF and DMARC are verified (`.ai/handoff.md:28`, `:31`). The reason Resend was chosen is not recorded.

### Consequences
* Good, because login codes and nudges come from the app's own domain, as [ADR-0017](0017-pilot-on-subdomain-via-cname.md) intended for deliverability.
* Bad, because login depends on one email provider: without `RESEND_API_KEY`, prod sends no codes and has no fallback (`docs/railway_pilot_deploy_guide.md:30`, gotcha 14).

## More Information
Evidence: 6fb57d1, 717baf6, af75ce2, `backend/src/modules/email/sendEmail.ts:25`, `docs/understanding/auth-sessions.md:17`, `docs/railway_pilot_deploy_guide.md:30`, `CLAUDE.md:175-176`, `.ai/handoff.md:28`, `:31`, gotcha 14. Amends [ADR-0007](0007-email-one-time-code-login.md), which names no provider. Related: [ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md), [ADR-0028](0028-nudge-stop-link-confirms-on-the-frontend.md), [ADR-0048](0048-nudge-in-process-timer-insert-before-send.md).
