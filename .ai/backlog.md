# Session Backlog

Rolling window of recent sessions. Complete overview lives in CLAUDE.md in root.

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

## Session: 2026-06-13 (session 6)

**Goal:** Build Phase B (frontend) and iterate via live walkthroughs.

Built Phase B end-to-end: wired the Claude-Design onboarding into `App.jsx` (Login → OnboardingFlow → PlanView → FirstSession → Closing), dropped server drafts (localStorage-only), added a plan view + Professor "first session" + reusable feedback. Then two live-walkthrough feedback rounds drove: removed "—P"/"Resumed"/broken links, "Bite-size wins" rename, de-gated the Risk step, fixed a reading contradiction; **restructured the flow so the AI runs mid-flow** (new `Suggestions` picker right after the domains step) with **switchable tracks** carried to the plan + Professor session, **selectable first-session tasks**, a **regenerate-on-thumbs-down** loop, and a **closing screen**. Backend guard relaxed to 3–6 career options. Verified the entire flow live in the browser preview. Also captured a post-pilot product direction (career-switch is a MODE; general learning engine) in `.ai/` + memory. Open: minor polish (enum leak in Professor copy, dead Proof/CoachReview files), then Phase C (deploy).

---

---

_Sessions 4–5 (2026-06-11/12, Phase A real-AI build) rolled out; they and the 2026-05-08 planning sessions live in CLAUDE.md "Recent Context."_
