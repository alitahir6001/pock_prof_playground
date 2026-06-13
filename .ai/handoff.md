## Last Updated - 2026-06-13

## Current State
Pilot-readiness work, plan A→B→C. Backend is real-AI end-to-end; frontend onboarding flow is wired, restructured, and verified end-to-end in the browser preview. Decisions locked: real AI now; drop onboarding drafts for pilot; integrate the Claude-Design onboarding; AI chain OpenAI→Gemini→Anthropic; ship the pilot first (research is a fast-follow).

**Phase A COMPLETE.** **Phase B essentially COMPLETE** — full flow (login → onboarding → AI track picker → sprint/risk/trigger → plan w/ switchable tracks → Professor first session → closing) built and verified live. Remaining before "done": a couple of polish nits + a real run against the user's browser, then Phase C (deploy).

### To run locally
Backend: `cd backend && npm run start:adaptation-runtime` (:3040). Frontend: `cd frontend && npm run dev` (:5173) or the preview tool. Local Postgres must be running; `frontend/.env.local` sets `VITE_API_BASE_URL`. Log in with any email; dev code prints on screen (RESEND not configured).

### Phase B progress (2026-06-12, session 5)
- **Decision: SHIP FIRST.** Founder chose YC "get real signal" over research-first. Research (agents + engine) is a fast-follow informed by pilot data, NOT a blocker. Captured in `.ai/behavioral-science-and-engine-alignment.md`.
- **Pilot goals:** guidance valued/trusted · users come back · personalization feels real. Existing tables already cover these — NO logging expansion needed for the pilot (rich taxonomy stays a future step).
- **Reviewed the onboarding design** (`frontend/src/onboarding/`): high-quality 11-step flow, persona-perfect, embodies the behavioral principles. Final submit → `onboarding_agent/run`; custom paths → `career_coach_agent/run`. Does NOT use professor_agent. **Critical gap: it captures the agent's output but only passes it to a non-existent dashboard — user never SEES their plan.**
- **Confirmed scope decisions:** ADD a Professor "first session" after the plan (supports "come back"); KEEP custom-path Coach review; DROP drafts → localStorage-only.
- **Phase B steps DONE (all 7):** frontend installed; fonts already in index.html; drafts → localStorage-only (key bumped v2); `OnboardingFlow` wired into `App.jsx` behind login; plan view renders agent output as cards; Professor "first session" added. Plus from the live walkthroughs:
  - Quick-fix batch: removed "— P" from non-welcome steps (CoachNote `sign` opt-in), removed broken "What is this?" link, added a cue suggestion, "two weeks"→"first two-week sprint", "micro-proofs"→"Bite-size wins", count-aware risk heading, removed feedback placeholder text.
  - **A (domains model):** Direction step is now hero free-text "What career domains pull at you?" + 10 broad domain chips + avoidance-friendly note; removed mid-flow CoachReview step; backend guard relaxed to **3–6 career_options, rank 1–6** (spec + 5-option example updated). Verified live: 6 varied options respecting "avoid X". `career_coach_agent` now unused in onboarding (kept for future).
  - **Black-canvas bug fixed:** `html,body` were transparent → set page bg globally in `styles.css`.
  - **B (refine loop):** plan thumbs-down → casual "what didn't fit?" → re-runs onboarding agent with `refinement` context → replaces plan. `OnboardingFlow` now passes `_submitted_input` so App can re-call. "Start over" relabeled "Adjust my answers".
  - **C (closing screen):** first session has "Mark today done" → `ClosingView` ("That's day one…").
- **Servers run via:** backend `cd backend && npm run start:adaptation-runtime` (:3040); frontend via preview tool or `npm run dev` (:5173). Local DB up. `frontend/.env.local` sets `VITE_API_BASE_URL=http://localhost:3040`.
- **Flow RESTRUCTURED (2026-06-13)** per user feedback — AI moved mid-flow:
  - New step order: welcome→schedule→energy→skills→direction→**suggestions**→sprint→risk→trigger→done (removed `proof`; `Proof.jsx`/`CoachReview.jsx` now dead files).
  - `steps/Suggestions.jsx` (NEW): runs `onboarding_agent` right after Direction, shows a **track picker** ("pick one, switch later"); pre-fills the sprint step from the AI's `sprint_recommendation`.
  - State (data.js): added `agent_output`, `agent_input`, `interaction_id`, `active_track_id`.
  - `OnboardingFlow` hands App an assembled `plan` ({tracks, active_track_id, interaction_id, agent_input, agent_output, sprint, triggers}) — NOT the raw agent response.
  - App `PlanView`: renders ALL tracks with a **switch** control (switching updates `active_track_id`); thumbs-down **regenerates** via `agent_input`+critique (distinct from switching). `FirstSessionView`: options are **selectable**; "Mark today done" gated on a pick → uses the **active track** for the Professor topic.
  - Quick fixes same session: removed "Resumed" footer, Risk step de-gated (no checkbox), Proof reading-contradiction fixed, "Redo my plan" shows a loader.
  - VERIFIED end-to-end in preview: intake→AI picker→pick→sprint/risk/trigger→done→plan(switch works)→first session(uses switched track, selectable)→closing. Builds clean.
  - Minor known nit: AI's "next actions" sometimes echo the raw enum "best_next" in user-facing text.
- **NEXT:** user walkthrough of the restructured flow for another round of feedback.

### Phase A #3 (prompts + guard fit) — DONE, verified LIVE
- Added `backend/src/modules/agents/phase2/ai/agentPromptSpecs.ts`: per-agent STRICT output contract text (exact fields/enums/counts/length caps mirroring the guard) + content rules. `buildSystemPrompt` now embeds spec + content rules + example.
- **Guard narrowed (user-approved domain fix):** the bare `/diagnos/` and `/prescribe/` patterns blocked core IT vocabulary ("diagnose a network issue", "run diagnostics", "prescribed checklist"). Now flagged only in medical/psychological collocation (noun list excludes tech-colliding words like "condition"). `agentOutputGuard.ts` updated + 2 new guard tests (technical allowed, medical still blocked).
- New `agentSpecConsistency.test.ts` (drift guard): asserts each `example_output.json` still passes the guard. It CAUGHT the professor example ("Diagnose a basic network issue") being wrongly rejected — that's what surfaced the guard issue.
- Extended `tests/adaptation/node-shims.d.ts` with `node:fs` (readFileSync) + `node:url` (fileURLToPath).
- **Live smoke `npm run smoke:agents`** (`scripts/smoke_agent_inference.mjs`, no DB): all 3 agents produced real guard-valid output via OpenAI (onboarding/coach deep ~7–9s, professor fast ~2.4s). Full offline suite **87/87**.

### Phase A #2 (route wiring) — DONE, verified offline (zero billable calls)
- New pure TS orchestrator `backend/src/modules/agents/phase2/ai/agentInferenceRunner.ts`: `runAgentInference({agentType,input,contract,config,tier})` → assembles prompt (soul+instructions+example shape), calls `generateAgentJson` with the guard as `validate`, returns first guard-valid output; on `AiAllProvidersFailedError` returns `example_output.json` (`usedFallback:true`) so a user is never 500'd. No fs/env/DB — injectable fetch.
- Wired into `scripts/run_adaptation_fastify.mjs`: `aiConfig` built once at startup (live timeout bounded to 20s via `AI_REQUEST_TIMEOUT_MS`, ~60s worst case across 3 providers); agent contracts loaded once at boot (`loadAgentContracts`, replaces `loadAgentTemplate`); route at :302 now calls `runAgentInference` with per-agent tier (onboarding/coach=deep, professor=fast); response keeps same shape + adds `ai:{source,tier,used_fallback}`; logs attempts; `/adaptation/health` now reports `ai_configured`.
- 4 runner unit tests (offline fake fetch): live success, guard-fallthrough, full→example fallback, prompt assembly. Added both AI test files to `test:phase3`. Full suite now **79/79**.
- NOT yet done in #2 (deliberate): real billable route smoke deferred to #3 (prompt isn't schema-hardened yet, so live output would mostly fail the strict guard and fall back). Also can't boot server locally yet — `DATABASE_URL` empty.

### Done this session
- **Migration blocker FIXED** (`backend/db/migrations/20260411_002_create_pilot_tables.up.sql`): removed `onboarding_drafts` table (broken `users(id)` FK). It sat inside the single BEGIN/COMMIT, so it rolled back ALL pilot tables on a clean DB. Drafts deferred post-pilot.
- **Built `backend/src/modules/agents/phase2/ai/aiProviderService.ts`** — multi-provider fallback via raw `fetch` (no SDKs). Skips providers w/o key; falls through on http/timeout/parse/validation failure; returns per-attempt diagnostics; throws `AiAllProvidersFailedError` only if all fail. Optional `validate` callback = the seam `agentOutputGuard` plugs into (#3). `extractJson` tolerates code fences/prose.
- **3 tiers fast/mid/deep** (default `mid`), per-provider-per-tier models, env-overridable via `<PROVIDER>_MODEL_<TIER>` (or shared `<PROVIDER>_MODEL`).
- **Chain order: OpenAI → Gemini → Anthropic** (cost/speed: OpenAI primary, Anthropic expensive last resort).
- Added module + `tests/agents/ai/**` to `tsconfig.json`. 17 offline unit tests (injectable fetch). Full suite **58/58** green.
- **Live smoke test** `npm run smoke:ai` (`AI_SMOKE_TIER=fast|mid|deep`) — `scripts/smoke_ai_provider.mjs`. All 3 providers verified live on all tiers; full chain answers via OpenAI ~1–1.5s.

### Verified model IDs (env-overridable)
- openai: fast `gpt-5.4-mini-2026-03-17`, mid `gpt-5.4-2026-03-05`, deep `gpt-5.5-2026-04-23`
- gemini: fast `gemini-3.5-flash`, mid `gemini-3.5-flash` (no distinct mid), deep `gemini-3.1-pro-preview`
- anthropic: fast `claude-haiku-4-5-20251001`, mid `claude-sonnet-4-6`, deep `claude-opus-4-8`

### Provider quirks (baked into the service — see CLAUDE.md gotchas 9–12)
- OpenAI gpt-5.x: needs `max_completion_tokens`, not `max_tokens`.
- `temperature` deprecated/rejected by Opus-4-8 & gpt-5.x → service OMITS it unless explicitly set.
- Gemini 3 are thinking models: thinking spends the `maxOutputTokens` budget → default raised to 2048; `thinkingBudget:0` rejected by pro, `thinkingLevel:'low'` accepted.
- Anthropic 404s on alias names (`*-latest`) → exact dated IDs only.
- Gemini pro latency highly variable (3s–44s) + transient 503s → timeout 60s + fallback handle it (reason it's not primary).

### Backend
- Agents now return REAL AI output: `/pilot/agents/:agentType/run` (`run_adaptation_fastify.mjs:302`) calls `runAgentInference`; `agentOutputGuard` IS in the chain (the `validate` callback); falls back to `example_output.json` only if all providers fail. Response adds `ai:{source,tier,used_fallback}`; `/adaptation/health` reports `ai_configured`.
- All pilot endpoints live in `scripts/run_adaptation_fastify.mjs` (`.mjs`, imports compiled TS from `dist/`).
- Adaptation engine complete (Phase 3). No Railway project — never deployed.
- NOT yet done: full route smoke (boot server → auth → POST run → DB insert). DB is now up, so this is possible; deferred — inference proven via `smoke:agents`. The .mjs throws on boot if `DATABASE_URL` empty (now set).

### Frontend (Phase B — built this session)
- `App.jsx` is now the real shell: Login → `OnboardingFlow` → `PlanView` (switchable tracks) → `FirstSessionView` (selectable tasks) → `ClosingView`. No more JSON wizard/debug line. `node_modules` installed; builds clean; verified live in preview.
- `frontend/src/onboarding/` is wired in. Flow: welcome→schedule→energy→skills→direction(domains)→**suggestions**(in-flow AI picker)→sprint→risk→trigger→done. Drafts are localStorage-only (`pp_onboarding_draft_v2`).
- DEAD files from the restructure (still on disk, unimported): `steps/Proof.jsx`, `steps/CoachReview.jsx` — safe to delete later.
- `frontend/.env.local` = `VITE_API_BASE_URL=http://localhost:3040` (gitignored).

### .env status
Filled: AI keys, TTLs, persistence mode, **`DATABASE_URL`/`ADAPTATION_DATABASE_URL`** (local Postgres 18 at `localhost:5432/postgres`, user `postgres`). EMPTY (needed for Railway deploy only): `ADAPTATION_HOST` (defaults to 127.0.0.1 locally), `FRONTEND_ORIGIN`, `RESEND_*`, `VITE_API_BASE_URL`.

### Local DB (2026-06-11)
Local Postgres 18 (EDB install at `/Library/PostgreSQL/18`) is RUNNING. Both migrations applied to a clean `postgres` DB — pilot migration committed cleanly, confirming the `onboarding_drafts` fix. 6 tables present (no `onboarding_drafts`). Server can now boot locally (full route smoke unblocked for #3).

## Changed Files (this session)
Phase A #1: `aiProviderService.ts` (+test), `smoke_ai_provider.mjs`, `tsconfig.json`, migration fix.
Phase A #2: `agentInferenceRunner.ts` (+test), wired `run_adaptation_fastify.mjs` (config/contracts/route/health).
Phase A #3: `agentPromptSpecs.ts`, hardened `buildSystemPrompt`, narrowed `agentOutputGuard.ts` (+2 tests), `agentSpecConsistency.test.ts`, `node-shims.d.ts` (+fs/url), `smoke_agent_inference.mjs`, `package.json` (`smoke:ai`/`smoke:agents` + AI tests in `test:phase3`).
DB: `.env` DATABASE_URL filled; both migrations applied locally.

## Strategic note (read before Phase 4+ / any behavioral-rule work)
`.ai/behavioral-science-and-engine-alignment.md` — durable analysis: the engine is a 5-rule SLICE of the 11-principle behavioral doc (full principle→code map + priority-order divergence inside); the doc's thresholds are unsourced; "learning styles" is debunked (research must exclude it); product is "sliced not incomplete" (fine for a concept pilot); plan for post-pilot research → operationalization → engine build; and the rich-logging foundation for the future "app learns the user" vision. NOT pilot-blocking.

## Open Threads
1. **Phase B polish** (small, optional before ship): (a) Professor prompt sometimes echoes raw enum "best_next" in user-facing "next actions" — add a prompt line to use plain task descriptions; (b) delete dead `steps/Proof.jsx` + `steps/CoachReview.jsx`; (c) edge case — changing domains after the AI ran shows stale suggestions (agent_output not cleared on domain change).
2. **Phase C (deploy)** — fill remaining `.env` (`FRONTEND_ORIGIN`, `RESEND_*`, `VITE_API_BASE_URL`, Railway `ADAPTATION_HOST=0.0.0.0`); Railway project + 2 migrations + smoke; Dockerfile/nixpacks (none exists). This is the main remaining work to get real users in.
3. Fast-follow (post-pilot, non-blocking): scoped research brief + cited scan — `.ai/behavioral-science-and-engine-alignment.md`.
   - Post-pilot product direction: "career-switch is a MODE, engine is general" → a "Learn a Skill" mode for any goal (founder wants to use it himself). `.ai/product-direction-multi-mode-learning.md`. Do NOT build into the pilot.

## Next Recommended Step
User does a fresh full walkthrough in their own browser for any final feedback. Then either knock out the Phase B polish nits (Open Thread 1) or move to **Phase C (deploy)** — the last big lever to get real users in. Servers: `cd backend && npm run start:adaptation-runtime` + `cd frontend && npm run dev`.
