## Last Updated - 2026-09-24 (context-file cleanup; project state unchanged since session 10, 2026-08-13)

## Current State
Nothing has shipped. Last code commit **2026-06-24**; last commit of any kind **2026-07-03**; session 9's docs work is still uncommitted. Deploy has been the single next step since 2026-06-14 — **two months of a one-item to-do list not getting done.**

Session 10 was a grilling session (no code) that found the actual cause of the stall, which is not what sessions 8–9 assumed. It is two things: **efficacy doubt** ("I don't know if I can build something that actually helps someone leave a job they hate") and **not understanding the codebase** ("I couldn't tell you how this works end to end"). The paid founder-run Wizard-of-Oz pilot is **dead** — its own kill criterion fired (founder would dread the daily texting), and it could never have answered the efficacy question anyway.

Test protocol and frozen branch criteria: `.ai/pilot-test-design.md`.

CLAUDE.md "Honest Assessment & Path to Revenue" remains valid on the *strategy* (moat is not curriculum; never build curriculum; founder-story content as distribution; B2G is a year-2 pull, not a sales motion). Its **pilot mechanics are superseded** — no paid 10-person cohort, no founder-as-engine SOP, no intervention log for now. Do NOT wire the engine. Do NOT pause for a re-architecture (event journal / tick / replay stays deferred to Phase 4).

### To run locally
Backend: `cd backend && npm run build:phase3 && npm run start:adaptation-runtime` (:3040). Frontend: `cd frontend && npm run dev` (:5173). Local Postgres 18 running, all 4 migrations applied. `frontend/.env.local` = `VITE_API_BASE_URL=http://localhost:3040`. Log in with any email; on-screen dev code requires `PILOT_EXPOSE_DEV_CODE=true` in `.env` (already set). Admin: `localhost:5173/#admin` as `ADMIN_EMAIL`. **The user runs servers and browses HIMSELF — do not use the preview tool unless asked.**

### Env / deploy state
- `.env` filled: AI keys, `DATABASE_URL`/`ADAPTATION_DATABASE_URL` (local PG18), `PILOT_EXPOSE_DEV_CODE=true`, `ADMIN_EMAIL`, `ADAPTATION_INTERNAL_TOKEN`. Empty (Railway-only): `FRONTEND_ORIGIN`, `RESEND_*`, prod `VITE_API_BASE_URL`.
- Railway needs `NODE_ENV=production` (#15); must NOT set `PILOT_EXPOSE_DEV_CODE` (#14). Build/start quirks: #17. Guide: `docs/railway_pilot_deploy_guide.md`.
- **4 migrations:** adaptation, pilot, sprint (003), logincodes (004).
- Resend: verify `pakfro.dev` (SPF/DKIM/DMARC at Porkbun); `RESEND_FROM_EMAIL` e.g. `login@pakfro.dev`.
- Verified model IDs (env-overridable): openai fast `gpt-5.4-mini-2026-03-17` / mid `gpt-5.4-2026-03-05` / deep `gpt-5.5-2026-04-23`; gemini fast+mid `gemini-3.5-flash`, deep `gemini-3.1-pro-preview`; anthropic fast `claude-haiku-4-5-20251001`, mid `claude-sonnet-4-6`, deep `claude-opus-4-8`.

## Active Task
**Phase C — Deploy (as the guided tour), then the n=3 silent efficacy test**

Two goals, one activity. Deploy the app this week with the founder driving and Claude narrating every seam he touches — this is simultaneously the ship and the end-to-end code walkthrough. Then run a **3-person, unpaid, 14-day, founder-silent** test of whether the software alone moves someone to do something they wouldn't have done alone. Full protocol: `.ai/pilot-test-design.md` (frozen once user 1 starts).

Running alongside: a **code-ownership ladder** — five real changes in this repo, founder typing, Claude explaining and reviewing. Not Claude writing.

### Order of operations
- [x] (user) **Commit + push** — done (verified 2026-09-24: `main` = `origin/main`, `.claude/skills/` tracked). Railway deploys from GitHub.
- [ ] (user + agent) **Deploy this week**, founder driving, Claude narrating each seam as it's hit: Railway project → Postgres → backend (root `/backend`) → frontend (root `/frontend`); env per `docs/railway_pilot_deploy_guide.md` (`NODE_ENV=production`, `ADAPTATION_PERSISTENCE_MODE=postgres`, `ADAPTATION_HOST=0.0.0.0`, exact `FRONTEND_ORIGIN`/`VITE_API_BASE_URL`, `ADMIN_EMAIL`, `RESEND_*`, AI keys; **never** `PILOT_EXPOSE_DEV_CODE`) → 4 migrations → smoke health/login/onboarding/plan/day/reload/`#admin`.
- [ ] (user) Subdomain on `pakfro.dev` (Porkbun CNAME) + Resend domain verification; AI spend caps on all 3 provider dashboards **before** anyone else gets the URL.
- [ ] (user) **Self-pilot 2–3 days adversarially** — real phone, cellular, post-shift tired, skip a day, check the comeback path.
- [ ] (user, typing) **Ownership ladder**, in order: (1) onboarding copy → (2) professor `soul.md` tone → (3) delete the dead `/pilot/onboarding/draft` call (gotcha #6) → (4) add a column to the admin cohort view → (5) change sprint length off 14. Then read the adaptation engine as a unit (5 rules, one pure function).
- [ ] (user) **Name 3 people.** One is already identified.
- [ ] (user) **Run the test:** day-0 script + pre-registration → 14 days of total silence → day-14 conversation. Log in `.ai/pilot-log.md`.
- [ ] (user + agent) **Score against `.ai/pilot-test-design.md` branch criteria the same week it ends.** No editing the bar after the fact.

### Watch out for
- Build = `npm install --include=dev && npm run build`; prod start = `start:prod`, NOT `start:adaptation-runtime` (gotcha #17).
- Prod boot REFUSES wildcard/unset `FRONTEND_ORIGIN` (#15). No dev_code in prod — Resend required (#14).
- **The trap:** "I should understand it first" is the same shape as "I should build the engine first" — a legitimate-sounding prerequisite in front of the falsifiable step. Deploy is the tour; it does not wait on reading.

### Required reading
- `.ai/pilot-test-design.md` — the protocol and the frozen branch criteria
- CLAUDE.md "Honest Assessment & Path to Revenue" (still valid on the moat; its *pilot mechanics* are superseded by this file) + gotchas #14–17
- `docs/railway_pilot_deploy_guide.md`

## Open Threads
1. **Deploy — the next action, nothing blocks it.** Session 10 is committed and pushed. Open Railway; founder drives, Claude narrates each seam.
2. **Two more names.** One person identified; the test needs 3.
3. **Pre-launch:** AI spend caps on all 3 provider dashboards, subdomain CNAME, Resend verification.
4. **Ownership ladder not started** — founder types, Claude reviews.
5. **`.ai/pilot-log.md` doesn't exist yet** — create at user 1's day 0.
6. **Post-test pile (gated on a result):** WTP test, engine wiring with real data, progression ladder, prompt-injection hardening, behavioral research, multi-mode.

## Next Recommended Step
**Open Railway and deploy.** That is where session 10 ended and where session 11 starts — no analysis, no walkthrough first, no re-doing the deploy prep (done and verified in session 7). Founder drives the dashboard; Claude narrates each seam as he hits it, since the deploy is also the end-to-end code tour. Everything else — the three names, the ownership ladder, the n=3 test — is downstream of a live URL.

## Out of Scope
Payments code · exit-report feature · wiring the adaptation engine · event-journal/tick/replay re-architecture · progression ladder · prompt-injection hardening · behavioral research · multi-mode · Phases 4–6 · any recruiting funnel or B2B motion. **Nothing new gets built until the n=3 test produces a result.** Fixes surfaced by the self-pilot are bugs and copy only.
