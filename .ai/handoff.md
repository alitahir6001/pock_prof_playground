## Last Updated - 2026-07-03 (session 8)

## Current State
Pilot-readiness work. **Phase A + B + B-polish + B2 Sprint Loop + Admin portal + pre-deploy Security pass all BUILT & verified (backend curl + builds); frontend pending user walkthrough.** Remaining before users: user walkthrough, then **Phase C (deploy)** — Nixpacks + Railway + run the 4 migrations + smoke. See `.ai/current-task.md`.

### Session 8 (2026-07-03) — strategy session, NO code changes
Whole-project analysis + pilot strategy. Decisions/conclusions (user-agreed):
- **Adaptation engine will NOT be wired for the pilot.** Frontend sends no session signals; instead the founder runs **Wizard-of-Oz adaptation** — watch the admin cohort, manually intervene when a rule *would* fire (e.g. trim workload after 2 missed days, message the user). Validates whether adaptation *matters* before automating; manual interventions calibrate the unsourced thresholds. Wire the engine only if pilot data earns it.
- **Pilot is judged on the RETENTION LOOP, not plan quality** (a ChatGPT plan is free — the moat is the accountability loop). Success thresholds to be written down BEFORE first user (e.g. X/10 return day-2, Y finish 7+ days). Dropouts = data (exit-question text), not failures.
- **Sequence: deploy → founder self-pilots 2–3 days adversarially (phone, cellular, 1am-tired, skip days and check the comeback experience) → recruit.** Founder is pilot user #1.
- **Domain: subdomain on founder's `pakfro.dev`** (e.g. `pilot.` or `app.`) via Porkbun CNAME → Railway — NOT a /pilot path (would need reverse-proxying). Same domain as Resend sender helps deliverability/trust. Lock subdomain before ordering QR cards.
- **Recruiting plan** (starts in parallel with deploy): warm bar/service network + bartender referral chain is the primary channel; QR business cards as conversation props, NOT passive stacks (QR → a "text me" / one-question form, not straight signup — commitment tolls filter idea-likers from doers); Reddit = DM hand-raisers on r/ITCareerQuestions / r/findapath / r/careerchange ("bartender wants into IT" posts), NOT broadcast posts (removed/dogpiled) and NOT dev subreddits (wrong persona). Pitch leads with founder story (15yr service-industry veteran who got out) + "I'm personally in your corner for 2 weeks" — sell the founder, not the app. Ideal cohort mix: ~6–7 toll-payers + 2–3 ambivalents (ambivalent who finishes = strongest validation).
- **Mobile: code-verified mobile-first** (viewport meta OK, all user screens `max-w-[440px]`, no hover-only interactions; the one 920px layout is AdminPortal = desktop tool). NOT yet thumb-tested — check 3-col chip grids + tap-target sizes on a 375px screen; real-phone test happens during the post-deploy self-pilot (avoids LAN env gymnastics).
- **Added to ship list:** set spend caps on all 3 AI provider dashboards before strangers touch the URL (no per-user rate limit exists); write pilot success thresholds down pre-launch; possible cheap post-deploy win = use the already-collected schedule/energy data to time nudges (turns the placebo screens real).
- Retention design notes for the pilot: at n=10 the founder IS the retention feature; personal SMS beats Resend automation for this demographic; design the comeback moment (miss ≠ shame, "welcome back + 10-min catch-up"); day-14 should end in a showable artifact (resume line), worth adding post-deploy.

Session-7 decisions: each sprint day = professor LLM call w/ day context (NOT curriculum graph); keep schedule+energy screens (felt-personalization; mechanics post-pilot — they only feed one LLM ranking + get stored, nothing downstream reads them); AI progression-ladder deferred post-pilot; admin auth = founder email gate (no static token); brute-force protection = hand-rolled attempt cap.

### Admin portal + Security (session 7, 2026-06-14)
- **Admin portal (founder-only):** frontend `#admin` route → `AdminPortal` in `App.jsx` (reuses email login). Backend `GET /pilot/admin/cohort` gated by `requireAdmin` (session email === `ADMIN_EMAIL`, **fail-closed** if unset). Cohort table: per-user onboarded?/days_done/last_session/segment + mailto nudge. Verified: admin 200, non-admin 403, no-token 401, unset-ADMIN_EMAIL 403.
- **Security fixes (all verified):** C1 `dev_code` now ONLY returned when `PILOT_EXPOSE_DEV_CODE=true` (was leaked whenever email undelivered → auth bypass); C2 login brute-force lockout — `attempts` col on `pilot_login_codes` (migration 004), 429 after 8 fails/TTL summed across codes; C3 refuses to boot if `NODE_ENV=production` & `FRONTEND_ORIGIN='*'`; M1 `/adaptation/evaluate` requires `ADAPTATION_INTERNAL_TOKEN` in prod (fail-closed), open locally so its smoke still passes; M2 codes now `crypto.randomInt` not `Math.random`.
- **Clean (no action):** all SQL parameterized; no XSS sinks (no dangerouslySetInnerHTML/eval); error handler no stack leak; session tokens 122-bit hashed. Prompt injection = LOW/contained (schema-guarded, escaped, single-tenant) — deferred.
- **NEW env vars** (added to local `.env`): `PILOT_EXPOSE_DEV_CODE=true` (LOCAL ONLY — without it the on-screen login code won't show), `ADMIN_EMAIL`, `ADAPTATION_INTERNAL_TOKEN`. Prod also needs `NODE_ENV=production`.
- **4 migrations now:** adaptation, pilot, sprint(003), logincodes(004 = attempts col).

### Phase B2 — what was built (session 7)
- **Migration** `20260413_003_create_sprint_tables` (+down, + `db:migrate:sprint:up/down` scripts). `pilot_plans` (one row/user, UNIQUE user_id; plan_json + active_track_id + sprint_day_count) + `pilot_sprint_days` (one row/completed day; UNIQUE(plan_id,day_index); completed_at = the return signal). FK→`pilot_users(user_id)`, own BEGIN/COMMIT (gotcha #6). Applied to local DB.
- **Backend routes** in `run_adaptation_fastify.mjs` (session-authed): `GET /pilot/plan` (null when none), `POST /pilot/plan` (upsert = **full replace, WIPES days** → onboarding/refine), `POST /pilot/plan/track` (**metadata-only, KEEPS days** → track switch), `POST /pilot/plan/day` (mark done, idempotent via ON CONFLICT). `loadPlanForUser` helper.
  - **Key invariant (don't break):** track-switch must NOT wipe sprint progress; that's why `/track` is separate from `/plan`. Verified via curl: switch kept D1, re-onboard wiped. User-delete cascades clean.
- **Frontend** (`App.jsx` rewrite + `api.js` `planApi` + `Suggestions.jsx` escape hatch):
  - On login: `planApi.get()` → returning user lands on new **DashboardView** (progress dots, Day N of 14, today's CTA, completed-days history, "View & adjust plan"); else OnboardingFlow.
  - `FirstSessionView`→**SessionView** (per-day, dynamic copy, day param in professor `context`). `ClosingView` removed; PlanView CTA now "Continue to my sprint"→dashboard.
  - One-session-per-local-day soft gate (`doneToday` via `completed_at` date compare) → CTA shows "done ✓ come back tomorrow".
  - Suggestions **escape hatch**: "None of these feel right?" → textarea → re-runs onboarding agent with `refinement` steer.
  - `npm run build` clean. NOT yet browser-verified (user runs + walks it themselves).

### To run locally
Backend: `cd backend && npm run build:phase3 && npm run start:adaptation-runtime` (:3040). Frontend: `cd frontend && npm run dev` (:5173). Local Postgres must be running; `frontend/.env.local` sets `VITE_API_BASE_URL=http://localhost:3040`. Log in with any email; **on-screen dev code now requires `PILOT_EXPOSE_DEV_CODE=true` in `.env`** (already set). Admin portal: visit `http://localhost:5173/#admin`, log in with the `ADMIN_EMAIL` address. NOTE: user prefers to run servers + browse manually — do NOT use the preview tool unless explicitly asked.

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

## Changed Files (session 7)
Polish: `agentPromptSpecs.ts` (enum-echo rule); `OnboardingFlow.jsx` (clear AI state on domain/note edits); DELETED `steps/Proof.jsx`, `steps/CoachReview.jsx`.
B2: NEW migration `db/migrations/20260413_003_create_sprint_tables.{up,down}.sql`; `backend/package.json` (sprint migrate scripts); `backend/scripts/run_adaptation_fastify.mjs` (4 plan routes + loadPlanForUser); `frontend/src/onboarding/api.js` (`planApi`); `frontend/src/App.jsx` (DashboardView, SessionView, persistence state machine); `frontend/src/onboarding/steps/Suggestions.jsx` (escape hatch).
Local DB now has `pilot_plans` + `pilot_sprint_days` (3rd migration applied).
B2 onboarding polish (session 7, 2026-06-14): `StripedCircle.jsx` (logo was blank — `currentColor` in an SVG `<pattern>` doesn't inherit from the referencing circle; set color on `<svg>` root + opacity 0.6); `data.js` SKILLS 10→15; `ChipRow.jsx` (+`grid` 3-col mode) used by `Skills.jsx`; `Done.jsx` CTA "Open dashboard"→"See my plan" (it leads to plan review, not the real dashboard). Builds clean.
Admin + Security (2026-06-14): `run_adaptation_fastify.mjs` (admin route + requireAdmin + 5 security fixes + config flags); `App.jsx` (AdminPortal + `#admin` router, MainApp split); migration `20260614_004_login_code_attempts.{up,down}.sql` + package.json scripts; `.env` (+PILOT_EXPOSE_DEV_CODE, ADMIN_EMAIL, ADAPTATION_INTERNAL_TOKEN).
Deploy prep (2026-06-14, all-Railway, NO Dockerfiles): `backend/package.json` (+`build`, +`start:prod` no-env-file, +engines); `frontend/package.json` (+`serve` dep, +`start` script, +engines); `backend/railway.json` + `frontend/railway.json` (Nixpacks, `npm install --include=dev && npm run build`). Verified: both build under NODE_ENV=production, backend start:prod boots w/ injected env (health 200), frontend `serve` serves dist (200). frontend `package-lock.json` updated (serve).
Post-wrap: **admin portal user-confirmed working in browser.** Admin nudge link changed from `mailto:` → **Gmail web compose** (`App.jsx` `nudgeUrl`, opens a browser draft, new tab). Nothing committed yet (batched-commit plan given to user).

## Strategic note (read before Phase 4+ / any behavioral-rule work)
`.ai/behavioral-science-and-engine-alignment.md` — durable analysis: the engine is a 5-rule SLICE of the 11-principle behavioral doc (full principle→code map + priority-order divergence inside); the doc's thresholds are unsourced; "learning styles" is debunked (research must exclude it); product is "sliced not incomplete" (fine for a concept pilot); plan for post-pilot research → operationalization → engine build; and the rich-logging foundation for the future "app learns the user" vision. NOT pilot-blocking.

### Phase B polish (session 7, 2026-06-13) — DONE, pending user walkthrough
- **Professor prompt enum-echo fix:** `agentPromptSpecs.ts:57` — added explicit rule: write `next_actions` as plain user-facing copy, do NOT use the raw enum names (`best_next`/`easier_fallback`/`catch_up`). Backend rebuilt clean. NOT yet verified live (would require billable `smoke:agents`; deferred to user walkthrough).
- **Dead files deleted:** `frontend/src/onboarding/steps/Proof.jsx` + `steps/CoachReview.jsx`. Remaining references are an unrelated `careerCoachReview` API method + the onboarding README (docs only). Frontend builds clean.
- **agent_output cleared on domain change:** `OnboardingFlow.jsx:114` — both `onToggleDomain` and `onNote` now null out `agent_output`/`agent_input`/`interaction_id`/`active_track_id` and reset sugPhase to 'thinking' if AI output already exists. Stale suggestions won't show after intake edits.
- Verification status: build/import-safe ✅, behavioral verification pending user walkthrough.

## Open Threads
1. **User walkthrough pending — B2 + admin.** Backend curl-verified; frontend builds but not browser-tested. B2 walk: fresh login → onboarding (check logo renders, 15 skills in 3 cols, escape hatch) → plan review → dashboard → start day 1 → mark done → dashboard shows D1 + "come back tomorrow" gate → reload (lands on dashboard, NOT onboarding) → view & adjust plan → switch track (progress survives). Watch: does day-2 professor task differ from day-1? Admin walk: `localhost:5173/#admin` → log in as `ADMIN_EMAIL` → cohort table; non-admin email → "not authorized".
2. **Phase C (deploy)** — Nixpacks (no Dockerfiles) + Railway + run **4 migrations** (adaptation, pilot, sprint, logincodes) + smoke. Prod env beyond CLAUDE table: `NODE_ENV=production`, `ADMIN_EMAIL`, `RESEND_*` (required — no dev_code in prod), exact `FRONTEND_ORIGIN` (boot refuses `*` in prod), leave `PILOT_EXPOSE_DEV_CODE` UNSET, `ADAPTATION_INTERNAL_TOKEN` optional. Deploy guide updated this session (env list + 4 migrations + chain fix).
   - **Resend sender plan:** founder owns `pakfro.dev` on Porkbun (forwarding only today). For the pilot: verify `pakfro.dev` in Resend (SPF/DKIM/DMARC DNS at Porkbun), set `RESEND_FROM_EMAIL` to e.g. `login@pakfro.dev`. Separately the founder wants `ali@pakfro.dev` as a real send/receive mailbox (Zoho free / Workspace / ImprovMX-Gmail-send-as) — not blocking deploy, but same domain/DNS.
3. Decisions needed during deploy: frontend on Railway static vs Vercel/Netlify? Custom domain or default `*.up.railway.app`?
4. **Post-pilot pile:** (a) AI progression ladder on track cards; (b) make schedule/energy drive real workload adaptation + wire adaptation engine (`/adaptation/evaluate` is internal-token-gated, not called by frontend); (c) prompt-injection hardening (low/contained today); (d) behavioral research — `.ai/behavioral-science-and-engine-alignment.md`; (e) multi-mode — `.ai/product-direction-multi-mode-learning.md`.

## Next Recommended Step
**DEPLOY. Everything else is downstream.** (Session-8 verdict: no technical blockers remain; validation latency is the project's only real risk. Post-deploy order: founder self-pilot 2–3 days → recruit via warm network + Reddit DMs.) Remaining for Phase C, in the Railway dashboard (user-driven, needs the code pushed to GitHub first): create project → Postgres plugin → backend service (root `/backend`) → frontend service (root `/frontend`) → set env per the deploy guide (incl. `NODE_ENV=production`, exact `FRONTEND_ORIGIN`/`VITE_API_BASE_URL`, `ADMIN_EMAIL`, `RESEND_*`; do NOT set `PILOT_EXPOSE_DEV_CODE`) → run the **4 migrations** against Railway Postgres → smoke `/adaptation/health` + full flow. Recommend a user walkthrough of B2 + admin locally first. Servers per "To run locally".
