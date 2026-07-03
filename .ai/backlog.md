# Session Backlog

Rolling window of recent sessions. Complete overview lives in CLAUDE.md in root.

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

## Session: 2026-06-12 (session 5)

**Goal:** Finish Phase A (real AI), then start Phase B (UI).

Shipped Phase A #2 (wired `agentInferenceRunner` into the live route) and #3 (per-agent schema specs in prompts; narrowed the guard's `/diagnos//prescribe/` for the IT domain after the drift-guard test caught the professor example being wrongly rejected). Verified live: all 3 agents produce real, personalized, guard-valid output (`npm run smoke:agents`). 87/87 tests. Set up local Postgres + applied both migrations (proved the migration fix). **Phase A complete.** Then a deep strategic discussion on behavioral science: documented the 11-principle-doc vs 5-rule-engine gap, the unsourced thresholds, and the "learning styles is debunked" caution in `.ai/behavioral-science-and-engine-alignment.md`. **Decision: ship the pilot first** (YC logic), research as a fast-follow. Started Phase B: reviewed the (excellent, persona-perfect) onboarding design, locked scope (add Professor first-session, keep Coach review, drop drafts), `npm install` + build pass. Next: simplify draft hook → wire `OnboardingFlow` into `App.jsx`.

---

## Session: 2026-06-11 (session 4)

**Goal:** Start Phase A (real AI wiring); get pre-pilot-ready.

Shipped Phase A #1: built `aiProviderService.ts` — multi-provider fallback (OpenAI→Gemini→Anthropic, raw fetch, no SDKs), 3 tiers (fast/mid/deep), env-overridable models, `validate`-callback seam for the guard. 17 unit tests + live smoke (`npm run smoke:ai`). Also fixed the `onboarding_drafts` migration blocker. Learned: the `.mjs` server is already far more complete than the docs claimed (auth/sessions/feedback all live); live testing caught 5 provider quirks (gpt-5.x `max_completion_tokens`, temperature deprecation, Gemini thinking-token budget, Anthropic dated-IDs, Gemini pro latency) — all fixed. Open: route still serves static output; Phase A #2/#3 (wire service in + per-agent prompts + guard) is next.

---

---

_Sessions 2026-05-08 (planning/setup) and earlier archived to CLAUDE.md "Recent Context."_
