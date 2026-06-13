# Session Backlog

Rolling window of recent sessions. Complete overview lives in CLAUDE.md in root.

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

## Session: 2026-05-08

**Goal:** Orient, plan, and set up for pilot readiness.

**Decisions made:**
- Tier 0 resolved: real AI — Gemini primary, OpenAI fallback, Claude fallback (all via env vars)
- Target users: service industry workers (bartenders, servers, cashiers) — app-literate, non-technical
- Deploy target: Railway (account exists, no project yet) + Resend (account exists, not configured)
- Frontend discovery: design tokens wired ✓, OnboardingFlow.jsx exists but orphaned (not in App.jsx) ✗

**Work completed:**
- Initialized all `.ai/` files
- Created `.env` with safe placeholders (no unsafe defaults)
- Updated project memory with all decisions
- Mapped full next-session work: env vars → AI wiring → UI integration → deploy

**Not started:**
- AI wiring (waiting for .env to be filled)
- OnboardingFlow.jsx integration into App.jsx
- Professor + career coach form UIs
- Output cards / debug line removal
- Railway deployment

---

_Sessions 2026-05-07 (initial orientation) and earlier archived to CLAUDE.md "Recent Context."_
