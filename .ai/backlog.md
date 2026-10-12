# Session Backlog

Rolling window of recent sessions, plus an archive of session history moved out of CLAUDE.md (bottom).

---

## Session: 2026-08-13 (session 10)

**Goal:** Grill the entire project idea. NO code changes.

Found the real cause of the two-month stall, and it was neither market nor time: **efficacy doubt** ("I don't know if I can build something that actually helps someone leave a job they hate" — untested against *zero* sit-down user conversations in eight months) and **the founder not being able to explain his own codebase**. Session 9's paid Wizard-of-Oz pilot was **killed** — its own written kill criterion fired (founder would dread the daily SMS SOP) and, by putting him in the loop by design, it could never have tested the belief that broke. Replaced with an **n=3 unpaid, 14-day, founder-SILENT** efficacy test: day-0 pre-registration of a specific months-stalled action, total silence, day-14 conversation, bar ≥1 of 3, branch criteria frozen before day 0 (`.ai/pilot-test-design.md`). WTP deferred as downstream of efficacy. Thesis reframed: the product is **the constraint** (one task, chosen for you, post-shift-sized, no bingeing), not the plan text. Checked the "unknowable over-engineered LLM thing" story against the code and it was wrong in the founder's disfavor — ~4,800 lines total, the "multi-agent system" is 3 prompt bundles + a fallback loop, and the 1,114-line adaptation engine (over half the backend TS) **is never called by the frontend** → new gotcha #18. Working agreement changed: on the code-ownership ladder the **founder types**, Claude only explains and reviews. Deploy reframed as the guided end-to-end tour rather than something a walkthrough gates. Open: deploy still unconfirmed; session ends pointed at opening Railway.

---

## Session: 2026-07-12 (session 9)

**Goal:** Honest whole-project evaluation + monetization strategy. NO code changes.

Verdict: strong engineering, backwards sequencing — Phases 0–3 predate all user contact, the engine is unwired speculative inventory, and deploy has been "the next step" for three sessions. Thesis revised: the moat is accountability + the founder ("a path with a person attached, where software gradually replaces the person"), never curriculum. Decisions: pilot becomes **PAID** ($20–25 out-of-band via payment link in the DM, which also captures phone numbers); day-14 artifact = manual founder-written **Exit Report** (app deliberately dead-ends at day 14); founder ops SOP = the 5 engine rules humanized + an **intervention log** that later calibrates the engine; **kill criteria** written before the first user; rejected pivots: B2B rebuild, generic AI-upskilling app, trashing the idea pre-data (B2G workforce funding = year-2 branch IF retention is strong but willingness-to-pay is weak). New durable CLAUDE.md section: "Honest Assessment & Path to Revenue". Late-session: evaluated pausing the pilot for an event-journal/tick/replay re-architecture — rejected pre-pilot (invisible at zero users; the redesign needs pilot data more than the pilot needs the redesign); deferred to Phase 4, with an optional ~1-day minimal event journal sanctioned if it doesn't delay deploy. Open: deploy still unconfirmed.

---

## Session: 2026-07-03 (session 8)

**Goal:** Whole-project analysis + pilot strategy. NO code changes (one code-level mobile audit, read-only).

Verdict on the project: engineering discipline is strong and the codebase is lean (~2k backend / ~2k frontend / 3.4k docs), but the headline adaptation engine is unwired speculative inventory and the pilot's real test is the **retention loop** (plan generation is not the moat — ChatGPT is free). Decisions: **don't wire the engine for the pilot — Wizard-of-Oz it** (founder manually intervenes via admin portal when a rule would fire; interventions calibrate the unsourced thresholds); judge pilot on retention with **pre-written numeric thresholds**; sequence = **deploy → founder self-pilots 2–3 days adversarially → recruit**; domain = **subdomain on pakfro.dev** (CNAME, not /pilot path); add **AI spend caps** pre-launch. Recruiting plan: warm bar network + referral chain primary; QR cards as conversation props with a commitment-toll landing (not passive stacks); Reddit = DM hand-raisers on ITCareerQuestions/findapath (not broadcast posts, not dev subs); pitch leads with the founder's 15-year service-industry story; cohort mix ~6–7 toll-payers + 2–3 ambivalents. Mobile: code-verified mobile-first (viewport OK, 440px shells, no hover-only), never thumb-tested — real-phone test folded into the self-pilot. Next session: **confirm the deploy is live/healthy**, then support the self-pilot.

---

## Session: 2026-06-13–14 (session 7)

**Goal:** Polish onboarding, close the pilot's biggest gaps, and get deploy-ready.

Polished onboarding (Professor enum-echo fix, deleted dead Proof/CoachReview, clear stale AI suggestions on domain edits, fixed blank hero logo — `currentColor` in an SVG pattern doesn't inherit from the referencing circle, expanded skills 10→15 in a 3-col grid, relabeled the misleading "Open dashboard" button). A walkthrough surfaced the **real gap: the flow dead-ended at onboarding + one in-memory task, so "do users return" was unmeasurable** — so built **Phase B2 Sprint Loop**: persistence (`pilot_plans` + `pilot_sprint_days`, migration 003), `GET/POST /pilot/plan` + `/plan/track` (switch keeps progress) + `/plan/day`, a real **DashboardView** with returning-user load + per-day sessions + one-per-day gate + escape hatch. Built a **founder-only admin cohort portal** (`#admin`, `ADMIN_EMAIL`-gated, fail-closed) to know who to nudge. Ran a **pre-deploy security pass**: fixed dev_code leak (C1), login brute-force lockout (C2, migration 004), wildcard-CORS prod-boot refusal (C3), gated `/adaptation/evaluate` (M1), CSPRNG codes (M2); SQL/XSS clean. **Deploy prep** (all-Railway, Nixpacks, NO Dockerfiles): `railway.json` ×2, `start:prod` (drops the `--env-file` that'd crash on Railway), static `serve` for frontend; caught that `NODE_ENV=production` skips devDeps → `--include=dev`. All backend + builds verified; frontend NOT browser-walked yet. **Closing the session the user is executing the Railway deploy (push → project → env → 4 migrations → smoke), the local B2/admin walkthrough, and Resend setup** — next session should CONFIRM the live deploy is healthy (Claude did not verify it), not redo prep.

---

---

_Session 6 archived to CLAUDE.md (now in the archive below). Sessions 4–5 (2026-06-11/12, Phase A real-AI build) rolled out earlier; they and the 2026-05-08 planning sessions live in the archive below ("From CLAUDE.md Recent Context")._

---

## Archive (moved 2026-09-24 from CLAUDE.md, handoff.md, current-task.md — verbatim)

### From CLAUDE.md Project Overview (priority line, as of 2026-08-13)

**Current priority (as of 2026-08-13): DEPLOY, then run an n=3 unpaid, founder-SILENT efficacy test.** Deploy has been the sole remaining step since 2026-06-14 and still has not happened; validation latency is the project's #1 risk. Read "Honest Assessment & Path to Revenue" below before proposing new build work, and note the session-10 correction at the end of it — **the paid Wizard-of-Oz pilot is dead.** See `.ai/pilot-test-design.md` for the frozen test protocol, `.ai/current-task.md` for the step list, `.ai/handoff.md` for session state.

### From CLAUDE.md Honest Assessment (session 9 evaluation + superseded pilot mechanics)

**What works:** founder–market fit (15yr service industry, made the switch himself, warm bartender network = distribution nobody can copy); engineering quality (security pass, fail-closed patterns, drift-guard tests); persona-calibrated onboarding; the sprint loop + admin portal (the actual product core); honest self-documentation.

**What doesn't:** sequencing — Phases 0–3 predate all user contact; the deterministic engine is unwired speculative inventory with invented thresholds (the pilot deliberately runs Wizard-of-Oz instead); "based on real science" positioning is unearned (unsourced thresholds, no safety layer); no willingness-to-pay test existed anywhere until session 9; deploy has been "the next step" since mid-June — validation latency accrues daily. Also: retention for this demographic likely depends on the founder's personal touch, so a successful pilot may prove the founder retains users, not the app — design for and watch that distinction.

**Path to money, in order:**
1. Deploy. Founder self-pilots 2–3 days adversarially.
2. **PAID pilot:** ~10 users, $20–25 for the guided 2-week sprint, payment out-of-band (Stripe link/Venmo in the DM *before* they get the URL — also captures phone numbers; build no payments code). Charging is the commitment filter and the only retention signal that predicts revenue.
3. Founder IS the engine (the 5 rules as a manual SOP — see `.ai/handoff.md`) and hand-writes each finisher's **Exit Report** (day-14 artifact; the app deliberately dead-ends at "Sprint complete").

**Kill criteria (write down pre-launch, next to success thresholds):** e.g. <5 paying users after ~3 weeks of honest recruiting, or <2/10 returning past day 7 despite personal texts → stop or pivot hard. Honest founder check: if the daily texting is dreaded, this model dies regardless of data — near-term, founder-led coaching IS the product.

### Session-10 correction (2026-08-13) — the pilot mechanics above are superseded

The strategy above stands. Its **pilot mechanics do not.** The paid 10-user founder-run Wizard-of-Oz pilot is dead on two counts: (1) its own written kill criterion fired — the founder would dread the daily-SMS SOP, so a *successful* result would commit him to work he doesn't want; (2) Wizard-of-Oz puts the founder in the loop **by design**, so it could never test the belief that actually broke his conviction.

That belief, surfaced by grilling in session 10, is the real cause of the two-month stall — not market, money, or time: **efficacy doubt** ("I don't know if I can build something that actually helps someone leave a job they hate"), never tested against a single sit-down user conversation in eight months, compounded by the founder being unable to explain his own codebase (see gotcha #18 — that story is measurably wrong in his disfavor).

### From CLAUDE.md Recent Context

**2026-08-13 (session 10): grilling — the paid pilot killed, replaced by an n=3 silent test. NO code.** Adversarial interview on the whole idea, prompted by two months of zero shipping. Found the stall's real cause: **efficacy doubt** ("I don't know if I can build something that actually helps someone leave a job they hate" — never tested; zero sit-down user conversations in eight months) plus **the founder being unable to explain his own codebase**. The session-9 paid Wizard-of-Oz pilot died on its own written kill criterion (he'd dread the daily SMS SOP) and because putting him in the loop by design made it unable to test the broken belief. Replaced with: **3 unpaid users, deployed app, 14 days, founder silent**, day-0 pre-registration of a months-stalled action, day-14 conversation, bar ≥1 of 3, branch criteria frozen pre-launch in `.ai/pilot-test-design.md`; WTP deferred as downstream of efficacy. Thesis reframed to **the constraint** (one task, chosen for you, post-shift-sized) rather than the plan text. Measured the repo against the founder's "unknowable over-engineered LLM thing" story and it was wrong in his disfavor → gotcha #18. Working agreement: on the code-ownership ladder **he types, Claude explains and reviews**. Deploy reframed as the guided end-to-end tour, explicitly not gated on a walkthrough. Session ended pointed at opening Railway.

**2026-07-03 + 2026-07-12 (sessions 8–9): strategy — pilot design + honest evaluation. NO code.** Session 8: do NOT wire the engine — **Wizard-of-Oz** it (founder manually intervenes via the admin portal when a rule would fire; interventions calibrate the unsourced thresholds); pilot judged on the **retention loop** with pre-written numeric thresholds; sequence = deploy → founder self-pilots 2–3 days adversarially → recruit (warm bar network + Reddit DMs to hand-raisers, founder-story pitch); subdomain on `pakfro.dev` (Porkbun CNAME); AI spend caps pre-launch. Session 9: full evaluation → the "Honest Assessment & Path to Revenue" section above. Pilot became **PAID** ($20–25 out-of-band via payment link in the DM, which also captures phone numbers); day-14 artifact = manual founder-written **Exit Report**; founder ops SOP = the 5 engine rules humanized + an **intervention log** (spreadsheet) that later calibrates the engine; **kill criteria** to be written before the first user; rejected: B2B rebuild, generic AI-upskilling pivot, and trashing the idea pre-data.

**2026-06-13–14 (session 7): onboarding polish + Sprint Loop + admin portal + security pass + deploy prep.** Polished onboarding (enum-echo fix, deleted dead Proof/CoachReview, clear stale AI on domain edits, fixed blank hero logo, skills 10→15 in 3-col grid, relabeled "Open dashboard"). A walkthrough exposed the flow dead-ending at onboarding + one in-memory task → built **Phase B2 Sprint Loop**: `pilot_plans`+`pilot_sprint_days` (migration 003), plan/track/day routes (track-switch keeps progress, re-onboard wipes), real DashboardView with returning-user load + per-day Professor sessions + one-per-day gate + Suggestions escape hatch — so "do users return" is finally measurable. Built a founder-only **admin cohort portal** (`#admin`, `ADMIN_EMAIL`-gated, fail-closed). **Pre-deploy security pass** (gotchas #14–16): fixed dev_code leak, login brute-force lockout (migration 004), wildcard-CORS prod refusal, gated `/adaptation/evaluate`, CSPRNG codes; SQL/XSS verified clean. **Deploy prep** (all-Railway, Nixpacks, no Dockerfiles; gotcha #17): `railway.json`×2, `start:prod`, static `serve`, `--include=dev` for the NODE_ENV devDep skip. Backend + builds verified; frontend not browser-walked. Deploy + walkthrough + Resend are the user's closing actions (next session: confirm live health, don't redo prep).

**2026-06-13 (session 6): Phase B complete.** Claude-designed onboarding wired into `App.jsx`; AI moved mid-flow (`Suggestions` track picker); switchable tracks propagate to Professor; thumbs-down regenerates; closing screen; guard relaxed to 3–6 career_options. Verified live in preview. Multi-mode direction captured in `.ai/product-direction-multi-mode-learning.md`. Resolved gotchas #1–2.

**2026-06-11/12 (sessions 4–5): Phase A complete — real AI end to end.** `aiProviderService.ts` (OpenAI→Gemini→Anthropic fallback, 3 tiers) + `agentInferenceRunner.ts` wired into the live route with the guard as `validate` callback; drift-guard test caught the professor example being wrongly rejected → guard narrowed for IT domain (gotchas #10–13). 87/87 offline + live `smoke:agents`. Fixed `onboarding_drafts` migration; local Postgres 18 up. Ship-first decision captured in `.ai/behavioral-science-and-engine-alignment.md`.

**2026-05-08–10 (sessions 2–3):** Planning + knowledge infra. Decisions: real AI fallback, target = service industry workers, Railway. Created `docs/INDEX.md`, `docs/understanding/`; flagged gotchas 6–8.

### From CLAUDE.md Next Session Priorities (as of 2026-08-13)

**Start here: open Railway and deploy.** Session 10's work is committed and pushed; there are no blockers left. The founder drives the dashboard, Claude narrates each seam as he hits it — env vars, migrations, boot, CORS, auth, admin gate — because the deploy doubles as the end-to-end code tour he asked for. Do not re-do deploy prep (done + verified in session 7) and do not let a walkthrough become a new gate in front of it.

1. **Deploy → smoke** (`/adaptation/health` with `ai_configured:true` → real email login → onboarding → plan → dashboard → mark a day → reload persists → `#admin`). Steps in `.ai/current-task.md`, guide in `docs/railway_pilot_deploy_guide.md`, quirks in gotchas #14–17.
2. **Pre-launch (user):** AI spend caps on all 3 provider dashboards, subdomain CNAME on `pakfro.dev`, Resend domain verification. No payment link — the test is unpaid.
3. **Founder self-pilot 2–3 days adversarially**, then Claude fixes what it surfaces — bugs and copy only.
4. **Code-ownership ladder — the founder types, Claude explains and reviews.** Order: onboarding copy → professor `soul.md` → delete the dead `/pilot/onboarding/draft` call (#6) → add an admin-cohort column → change sprint length off 14 → then read the adaptation engine as a unit. Do not write these for him; that reproduces the problem.
5. **Run the n=3 test** per `.ai/pilot-test-design.md` (frozen once user 1 starts): 3 names, day-0 pre-registration, 14 days of silence, day-14 conversation, score against the written branches the same week.
6. Post-test pile (gated on a result): WTP test; wire the engine with real data (candidate design: append-only event journal + deterministic tick + replay/backtesting — deferred session 9, still deferred); progression ladder; prompt-injection hardening; behavioral research; multi-mode.

### From handoff.md: Session 10 (2026-08-13) — grilling, no code
- **Founder answers that redirected everything:** conviction broke on *differentiation*; the dread is not the texting or the money but "I don't know if I can pull this off"; if the repo vanished he'd mourn **the code, not the mission**; he has had **zero** sit-down conversations with a target user in eight months.
- **Replacement test:** 3 unpaid people, deployed app, 14 days, **founder silent**. Day 0 pre-registers a specific thing each has been stalled on for months; day 14 asks what they actually did. Bar: **≥1 of 3** does it. Both branches written before day 0. WTP deferred — it's downstream of efficacy.
- **Thesis reframe:** the product is **the constraint** (one task, chosen for you, post-shift-sized, no bingeing), not the plan text. That is the thing a chat box structurally cannot be, it's already built, and an unprompted day-5 return is evidence for it.
- **Codebase facts established against the "unknowable over-engineered LLM thing" story** — the story was inaccurate in the founder's disfavor:
  - Whole repo ≈ **4,800 lines** (2,145 backend TS + 613 server shell + 2,080 frontend).
  - The **adaptation engine is 1,114 lines — over half the backend TS — and the frontend never calls it.** Zero references to `/adaptation/` in `frontend/src`. Most of the "over-engineered" feeling is a subsystem that doesn't run.
  - The "multi-agent approach" is 3 folders × 4 files (`soul.md`, `system_instructions.md`, `output_schema.ts`, `example_output.json`) + one runner that builds a single prompt and falls back across providers. No orchestration, no autonomy.
  - Live product = 13 routes, 9 called by the frontend (one of those, `/pilot/onboarding/draft`, doesn't exist server-side — gotcha #6).
- **Working agreement changed: the founder types, Claude explains and reviews.** For the ownership ladder Claude does NOT write the code. Ladder order in handoff `## Active Task`; engine read last.
- **Deploy is the guided tour** — env, migrations, boot, CORS, auth, admin gate are every seam of the system with immediate feedback. It does not wait on a walkthrough; "understand it first" is the same avoidance shape as "build the engine first."
- Adaptation engine: **left in place**, to be read and understood, not deleted, not wired.

### From current-task.md: Why (session 10)
Session 10 grilling found the real root cause of the two-month stall, and it wasn't market, money, or time:

1. **Efficacy doubt** — "I don't know if I can build something that actually helps someone leave a job they hate." Untested after eight months; the repo records zero sit-down user conversations.
2. **Not understanding the codebase** — "I couldn't tell you how this works end to end." Partly false in the founder's disfavor: ~4,800 lines total, three prompt bundles and a provider fallback loop, and the 1,114-line adaptation engine that causes most of the "over-engineered" feeling **is not in the live path at all** (nothing in `frontend/src` calls `/adaptation/`).

The session-8/9 paid Wizard-of-Oz pilot is **dead**. Its own written kill criterion fired (founder would dread the daily texting, so a good result commits him to work he doesn't want), and it structurally could not answer #1 — putting the founder in the loop makes any success unattributable.

**Thesis now under test:** the product is *the constraint* — one task, chosen for you, sized for a post-shift brain, no bingeing, no spiraling — not the plan text. ChatGPT gives infinite optionality, which is what paralyzes the target user. A gate is the one thing a chat box structurally cannot be.
