## Last Updated - 2026-08-13 (session 10)

## Current State
Nothing has shipped. Last code commit **2026-06-24**; last commit of any kind **2026-07-03**; session 9's docs work is still uncommitted. Deploy has been the single next step since 2026-06-14 — **two months of a one-item to-do list not getting done.**

Session 10 was a grilling session (no code) that found the actual cause of the stall, which is not what sessions 8–9 assumed. It is two things: **efficacy doubt** ("I don't know if I can build something that actually helps someone leave a job they hate") and **not understanding the codebase** ("I couldn't tell you how this works end to end"). The paid founder-run Wizard-of-Oz pilot is **dead** — its own kill criterion fired (founder would dread the daily texting), and it could never have answered the efficacy question anyway.

New plan in `.ai/current-task.md`; the test protocol and frozen branch criteria in `.ai/pilot-test-design.md`.

## Session 10 (2026-08-13) — grilling, no code
- **Founder answers that redirected everything:** conviction broke on *differentiation*; the dread is not the texting or the money but "I don't know if I can pull this off"; if the repo vanished he'd mourn **the code, not the mission**; he has had **zero** sit-down conversations with a target user in eight months.
- **Replacement test:** 3 unpaid people, deployed app, 14 days, **founder silent**. Day 0 pre-registers a specific thing each has been stalled on for months; day 14 asks what they actually did. Bar: **≥1 of 3** does it. Both branches written before day 0. WTP deferred — it's downstream of efficacy.
- **Thesis reframe:** the product is **the constraint** (one task, chosen for you, post-shift-sized, no bingeing), not the plan text. That is the thing a chat box structurally cannot be, it's already built, and an unprompted day-5 return is evidence for it.
- **Codebase facts established against the "unknowable over-engineered LLM thing" story** — the story was inaccurate in the founder's disfavor:
  - Whole repo ≈ **4,800 lines** (2,145 backend TS + 613 server shell + 2,080 frontend).
  - The **adaptation engine is 1,114 lines — over half the backend TS — and the frontend never calls it.** Zero references to `/adaptation/` in `frontend/src`. Most of the "over-engineered" feeling is a subsystem that doesn't run.
  - The "multi-agent approach" is 3 folders × 4 files (`soul.md`, `system_instructions.md`, `output_schema.ts`, `example_output.json`) + one runner that builds a single prompt and falls back across providers. No orchestration, no autonomy.
  - Live product = 13 routes, 9 called by the frontend (one of those, `/pilot/onboarding/draft`, doesn't exist server-side — gotcha #6).
- **Working agreement changed: the founder types, Claude explains and reviews.** For the ownership ladder Claude does NOT write the code. Ladder order in `.ai/current-task.md`; engine read last.
- **Deploy is the guided tour** — env, migrations, boot, CORS, auth, admin gate are every seam of the system with immediate feedback. It does not wait on a walkthrough; "understand it first" is the same avoidance shape as "build the engine first."
- Adaptation engine: **left in place**, to be read and understood, not deleted, not wired.

## Still in force from sessions 8–9
CLAUDE.md "Honest Assessment & Path to Revenue" remains valid on the *strategy* (moat is not curriculum; never build curriculum; founder-story content as distribution; B2G is a year-2 pull, not a sales motion). Its **pilot mechanics are superseded** — no paid 10-person cohort, no founder-as-engine SOP, no intervention log for now. Do NOT wire the engine. Do NOT pause for a re-architecture (event journal / tick / replay stays deferred to Phase 4).

## To run locally
Backend: `cd backend && npm run build:phase3 && npm run start:adaptation-runtime` (:3040). Frontend: `cd frontend && npm run dev` (:5173). Local Postgres 18 running, all 4 migrations applied. `frontend/.env.local` = `VITE_API_BASE_URL=http://localhost:3040`. Log in with any email; on-screen dev code requires `PILOT_EXPOSE_DEV_CODE=true` in `.env` (already set). Admin: `localhost:5173/#admin` as `ADMIN_EMAIL`. **The user runs servers and browses HIMSELF — do not use the preview tool unless asked.**

## Env / deploy state
- `.env` filled: AI keys, `DATABASE_URL`/`ADAPTATION_DATABASE_URL` (local PG18), `PILOT_EXPOSE_DEV_CODE=true`, `ADMIN_EMAIL`, `ADAPTATION_INTERNAL_TOKEN`. Empty (Railway-only): `FRONTEND_ORIGIN`, `RESEND_*`, prod `VITE_API_BASE_URL`.
- Railway needs `NODE_ENV=production` (#15); must NOT set `PILOT_EXPOSE_DEV_CODE` (#14). Build/start quirks: #17. Guide: `docs/railway_pilot_deploy_guide.md`.
- **4 migrations:** adaptation, pilot, sprint (003), logincodes (004).
- Resend: verify `pakfro.dev` (SPF/DKIM/DMARC at Porkbun); `RESEND_FROM_EMAIL` e.g. `login@pakfro.dev`.
- Verified model IDs (env-overridable): openai fast `gpt-5.4-mini-2026-03-17` / mid `gpt-5.4-2026-03-05` / deep `gpt-5.5-2026-04-23`; gemini fast+mid `gemini-3.5-flash`, deep `gemini-3.1-pro-preview`; anthropic fast `claude-haiku-4-5-20251001`, mid `claude-sonnet-4-6`, deep `claude-opus-4-8`.

## Changed Files (session 10)
No code. New: `.ai/pilot-test-design.md`. Rewritten: `.ai/current-task.md`, `.ai/handoff.md`. Updated: `.ai/backlog.md` (session-10 entry; session 6 rolled out), `CLAUDE.md` (priority line, session-10 correction appended to Honest Assessment, gotcha #18, Recent Context, Next Session Priorities). Session-9 backlog was committed + pushed by the user before wrap.

## Open Threads
1. **Deploy — the next action, nothing blocks it.** Session 10 is committed and pushed. Open Railway; founder drives, Claude narrates each seam.
2. **Two more names.** One person identified; the test needs 3.
3. **Pre-launch:** AI spend caps on all 3 provider dashboards, subdomain CNAME, Resend verification.
4. **Ownership ladder not started** — founder types, Claude reviews.
5. **`.ai/pilot-log.md` doesn't exist yet** — create at user 1's day 0.
6. **Post-test pile (gated on a result):** WTP test, engine wiring with real data, progression ladder, prompt-injection hardening, behavioral research, multi-mode.

## Next Recommended Step
**Open Railway and deploy.** That is where session 10 ended and where session 11 starts — no analysis, no walkthrough first, no re-doing the deploy prep (done and verified in session 7). Founder drives the dashboard; Claude narrates each seam as he hits it, since the deploy is also the end-to-end code tour. Everything else — the three names, the ownership ladder, the n=3 test — is downstream of a live URL.
