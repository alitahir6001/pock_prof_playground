# Current Task

**Phase C — Deploy (as the guided tour), then the n=3 silent efficacy test**
Last updated: 2026-08-13 (session 10)

## What
Two goals, one activity. Deploy the app this week with the founder driving and Claude narrating every seam he touches — this is simultaneously the ship and the end-to-end code walkthrough. Then run a **3-person, unpaid, 14-day, founder-silent** test of whether the software alone moves someone to do something they wouldn't have done alone. Full protocol: `.ai/pilot-test-design.md` (frozen once user 1 starts).

Running alongside: a **code-ownership ladder** — five real changes in this repo, founder typing, Claude explaining and reviewing. Not Claude writing.

## Why
Session 10 grilling found the real root cause of the two-month stall, and it wasn't market, money, or time:

1. **Efficacy doubt** — "I don't know if I can build something that actually helps someone leave a job they hate." Untested after eight months; the repo records zero sit-down user conversations.
2. **Not understanding the codebase** — "I couldn't tell you how this works end to end." Partly false in the founder's disfavor: ~4,800 lines total, three prompt bundles and a provider fallback loop, and the 1,114-line adaptation engine that causes most of the "over-engineered" feeling **is not in the live path at all** (nothing in `frontend/src` calls `/adaptation/`).

The session-8/9 paid Wizard-of-Oz pilot is **dead**. Its own written kill criterion fired (founder would dread the daily texting, so a good result commits him to work he doesn't want), and it structurally could not answer #1 — putting the founder in the loop makes any success unattributable.

**Thesis now under test:** the product is *the constraint* — one task, chosen for you, sized for a post-shift brain, no bingeing, no spiraling — not the plan text. ChatGPT gives infinite optionality, which is what paralyzes the target user. A gate is the one thing a chat box structurally cannot be.

## Order of operations
- [ ] (user) **Commit + push** — outstanding since 2026-07-12, incl. untracked `.claude/skills/`. Railway deploys from GitHub.
- [ ] (user + agent) **Deploy this week**, founder driving, Claude narrating each seam as it's hit: Railway project → Postgres → backend (root `/backend`) → frontend (root `/frontend`); env per `docs/railway_pilot_deploy_guide.md` (`NODE_ENV=production`, `ADAPTATION_PERSISTENCE_MODE=postgres`, `ADAPTATION_HOST=0.0.0.0`, exact `FRONTEND_ORIGIN`/`VITE_API_BASE_URL`, `ADMIN_EMAIL`, `RESEND_*`, AI keys; **never** `PILOT_EXPOSE_DEV_CODE`) → 4 migrations → smoke health/login/onboarding/plan/day/reload/`#admin`.
- [ ] (user) Subdomain on `pakfro.dev` (Porkbun CNAME) + Resend domain verification; AI spend caps on all 3 provider dashboards **before** anyone else gets the URL.
- [ ] (user) **Self-pilot 2–3 days adversarially** — real phone, cellular, post-shift tired, skip a day, check the comeback path.
- [ ] (user, typing) **Ownership ladder**, in order: (1) onboarding copy → (2) professor `soul.md` tone → (3) delete the dead `/pilot/onboarding/draft` call (gotcha #6) → (4) add a column to the admin cohort view → (5) change sprint length off 14. Then read the adaptation engine as a unit (5 rules, one pure function).
- [ ] (user) **Name 3 people.** One is already identified.
- [ ] (user) **Run the test:** day-0 script + pre-registration → 14 days of total silence → day-14 conversation. Log in `.ai/pilot-log.md`.
- [ ] (user + agent) **Score against `.ai/pilot-test-design.md` branch criteria the same week it ends.** No editing the bar after the fact.

## Out of scope
Payments code · exit-report feature · wiring the adaptation engine · event-journal/tick/replay re-architecture · progression ladder · prompt-injection hardening · behavioral research · multi-mode · Phases 4–6 · any recruiting funnel or B2B motion. **Nothing new gets built until the n=3 test produces a result.** Fixes surfaced by the self-pilot are bugs and copy only.

## Watch out for
- Build = `npm install --include=dev && npm run build`; prod start = `start:prod`, NOT `start:adaptation-runtime` (gotcha #17).
- Prod boot REFUSES wildcard/unset `FRONTEND_ORIGIN` (#15). No dev_code in prod — Resend required (#14).
- **The trap:** "I should understand it first" is the same shape as "I should build the engine first" — a legitimate-sounding prerequisite in front of the falsifiable step. Deploy is the tour; it does not wait on reading.

## Required reading
- `.ai/pilot-test-design.md` — the protocol and the frozen branch criteria
- CLAUDE.md "Honest Assessment & Path to Revenue" (still valid on the moat; its *pilot mechanics* are superseded by this file) + gotchas #14–17
- `docs/railway_pilot_deploy_guide.md`
