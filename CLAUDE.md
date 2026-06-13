# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pocket Professor is a structured learning platform for career-switchers. The core is a **deterministic multi-agent adaptation engine** — no randomness, reproducible with the same inputs. Currently at Phase 3 (adaptation engine implementation), with Phases 4–6 planned.

**Current priority (as of 2026-05-08): Pilot readiness.** Get the app deployable and usable by real non-technical users (service industry workers). See `.ai/current-task.md` for the active work plan and `.ai/handoff.md` for session state.

## Commands

### Backend (run from `/backend`)

```bash
npm run build:phase3              # Compile TypeScript → dist/
npm run test:phase3               # Build + run all unit tests
npm run start:adaptation-runtime  # Start Fastify server on port 3040
npm run smoke:adaptation-runtime  # Validate health/success/failure paths
npm run start:adaptation-worker   # Run single worker job envelope
npm run smoke:adaptation-worker   # Test worker determinism + telemetry
npm run start:adaptation-broker-worker   # Process broker-style file-queue batch
npm run smoke:adaptation-broker-worker   # Test broker determinism + telemetry

# Database migrations (PostgreSQL required)
npm run db:migrate:adaptation:up   # Apply adaptation_evaluations schema
npm run db:migrate:adaptation:down
npm run db:migrate:pilot:up        # Apply pilot_users/pilot_sessions schema
npm run db:migrate:pilot:down
```

### Frontend (run from `/frontend`)

```bash
npm run dev      # Vite dev server → localhost:5173
npm run build    # Build static assets to dist/
npm run preview  # Preview production build
```

### Running a single test

Tests use Node's native test runner. Compile first, then run the specific file:

```bash
cd backend && npm run build:phase3 && node dist/tests/adaptation/<test-file>.js
```

## Architecture

### Phase Progression

The project is built incrementally through phases. Phases 0–2 are complete (behavioral rules, architecture, agent contracts). Phase 3 (adaptation engine) is active. Phases 4–6 are planned.

- **Phase 0** — Behavioral research (`docs/behavioral_design_v1.md`)
- **Phase 1** — System architecture + DB entities (`docs/phase1_system_architecture_plan.md`)
- **Phase 2** — Agent contracts: Onboarding, Professor, Career Coach (`backend/src/modules/agents/phase2/`)
- **Phase 3** — Deterministic adaptation engine (`backend/src/modules/adaptation/phase3/`) ← current
- **Phase 4** — Curriculum graph + pivot engine (planned)
- **Phase 5** — Market gap intelligence (planned)
- **Phase 6** — Freemium gating middleware (planned)

### Adaptation Engine (Phase 3)

The adaptation engine is the critical path. It evaluates five priority-ordered rules against a user's session signal and applies the first match:

1. `R_TOPIC_RESISTANCE_ESCALATE_CAREER_COACH` — topic resistance signal → call Career Coach
2. `R_PIVOT_INTEREST_RECALCULATE_GRAPH` — pivot interest signal → recalculate curriculum (structural mutation)
3. `R_MISSED_2_IN_7D_REDUCE_WORKLOAD_25` — 2+ missed sessions in 7 days → reduce workload 25%
4. `R_LATE_NIGHT_3_SHIFT_SCHEDULE` — 3+ late-night sessions → suggest schedule shift
5. `R_COMPLETED_5_INCREASE_DIFFICULTY` — 5 consecutive completions → increase difficulty

Key files:
- `policyEngine.ts` — Pure rule evaluator (no side effects)
- `adaptationEvaluationService.ts` — Orchestrator: evaluator → record → persist
- `adaptationEvaluationPersistence.ts` — Transaction with **fail-closed semantics** for structural mutations
- `adaptationEvaluationEntrypoints.ts` — HTTP/worker handler wiring

### Persistence Modes

Controlled by `ADAPTATION_PERSISTENCE_MODE` env var:
- `file` (default for local dev) — JSON file at `ADAPTATION_AUDIT_FILE`
- `postgres` (pilot/production) — requires `ADAPTATION_DATABASE_URL`

Both implement the same persistence adapter interface. Structural mutations (curriculum graph changes) are fail-closed: the mutation does not commit if the audit record fails to persist.

### Agent Contracts (Phase 2)

Three agents each have a strict contract in `backend/src/modules/agents/phase2/`:
- `onboarding-agent/` — soul, system instructions, output schema, example output
- `professor-agent/`
- `career-coach-agent/`

All agent output passes through `agentOutputGuard.ts` (schema validation + prohibited content filtering) before use.

### API Endpoints (Fastify, port 3040)

- `GET /adaptation/health`
- `POST /adaptation/evaluate`
- `POST /pilot/auth/email/request`
- `POST /pilot/auth/email/verify`
- `GET /pilot/agents/:agentType`

### Database Schema

- `adaptation_evaluations` — Audit records per evaluation
- `pilot_users` — User records (user_id, email)
- `pilot_sessions` — Session tokens
- Raw SQL migrations in `backend/db/migrations/`

## Frontend Structure

- `frontend/src/App.jsx` — current entry point. A developer wizard (raw JSON textarea inputs, raw JSON output). **Needs to be replaced with proper UX before pilot.**
- `frontend/src/onboarding/` — full Claude-designed multi-step onboarding flow (11 steps). Design tokens wired. **Not yet integrated into App.jsx.**
- `frontend/src/onboarding/tokens.css` — Tailwind v4 CSS-first design tokens (paper/ink/accent color scales, serif/sans/mono fonts). Imported via `styles.css` → `main.jsx`.
- `frontend/src/styles.css` — global stylesheet; imports Tailwind then tokens.

### UI Integration needed
1. Wire `OnboardingFlow.jsx` into `App.jsx` (replace JSON textarea for onboarding step)
2. Build form UIs for professor and career-coach steps (match token style)
3. Replace raw JSON `<pre>` output with human-readable cards
4. Remove debug "API Base:" line at `App.jsx:132`

## AI Provider Chain

`backend/src/modules/agents/phase2/ai/aiProviderService.ts` implements a multi-provider fallback (raw `fetch`, no SDKs): **OpenAI → Gemini → Anthropic** (order balances cost/speed). Providers without a key are skipped; failures (http/timeout/parse/validation) fall through to the next. Three capability/cost tiers — `fast` / `mid` / `deep` (default `mid`) — each mapping to a model per provider, all env-overridable via `<PROVIDER>_MODEL_<TIER>`. Verify keys + model names live with `npm run smoke:ai` (`AI_SMOKE_TIER=fast|mid|deep`).

The service is **wired into the live route** (`/pilot/agents/:agentType/run`) via the `agentInferenceRunner.ts` orchestrator: it assembles each agent's prompt (soul + instructions + the strict schema spec from `agentPromptSpecs.ts` + example), runs the provider chain with `agentOutputGuard` as the `validate` callback, and falls back to `example_output.json` only if every provider fails. Per-agent tiers: Professor=`fast`, Onboarding/Coach=`deep`. Verify live with `npm run smoke:agents` (real AI, no DB). See gotchas 9–13 for provider quirks, the schema-in-prompt requirement, and the guard narrowing.

## Tech Stack

- **Backend:** TypeScript 5.6 (strict, ESM), Node 20+, Fastify 5, `pg`
- **Frontend:** React 18, Vite 5 (JSX, no TypeScript)
- **Tests:** Node native test runner (`node:test`, `node:assert/strict`) — no Jest/Vitest
- **DB:** PostgreSQL only (no SQLite/in-memory alternative)

## Environment Variables

| Variable | Local dev | Production (Railway) | Notes |
|---|---|---|---|
| `DATABASE_URL` | local postgres URL | Railway Postgres plugin → Connect tab | |
| `ADAPTATION_DATABASE_URL` | same as DATABASE_URL | same as DATABASE_URL | |
| `ADAPTATION_PERSISTENCE_MODE` | `file` | `postgres` | |
| `ADAPTATION_AUDIT_FILE` | `./data/adaptation-evaluations.json` | — | file mode only |
| `ADAPTATION_PORT` | `3040` | `3040` | |
| `ADAPTATION_HOST` | `127.0.0.1` | `0.0.0.0` | containers must bind all interfaces |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | exact Railway frontend URL | no trailing slash, no wildcards |
| `VITE_API_BASE_URL` | `http://localhost:3040` | exact Railway backend URL | no trailing slash; `VITE_` exposes to browser — never put secrets here |
| `OPENAI_API_KEY` | — | from platform.openai.com | primary AI provider (chain: OpenAI→Gemini→Anthropic) |
| `GEMINI_API_KEY` | — | from Google AI Studio | first fallback |
| `ANTHROPIC_API_KEY` | — | from console.anthropic.com | last fallback (most expensive) |
| `RESEND_API_KEY` | — | from resend.com | required for email auth |
| `RESEND_FROM_EMAIL` | — | verified sender address | must match Resend domain |

## Key Constraints

- **Deterministic only** — identical inputs must produce identical outputs; no randomness anywhere
- **Fail-closed structural mutations** — audit record must persist before any curriculum graph change commits
- **Structural mutation cap** — max 1 per week per user
- **TypeScript strict mode** — required throughout backend
- **Agent output guard** — all agent responses must pass schema validation + content filtering before use

## Active Gotchas

_Numbered in discovery order. Never delete — only add._

1. **`OnboardingFlow.jsx` is now WIRED (RESOLVED 2026-06-13).** `App.jsx` is the real shell: Login → `OnboardingFlow` → `PlanView` → `FirstSessionView` → `ClosingView`. The flow runs the onboarding AI mid-flow (the `Suggestions` step) and is verified live. Dead files from the restructure: `steps/Proof.jsx`, `steps/CoachReview.jsx` (unimported; safe to delete).
2. **`App.jsx` is now the user-facing shell (RESOLVED 2026-06-13).** No longer a JSON dev wizard. Mobile-first (`max-w-[440px]`). Page bg set globally in `styles.css` (html/body were transparent → black overscroll). Drafts are localStorage-only (`pp_onboarding_draft_v2`).
3. **Agents return REAL AI output (RESOLVED 2026-06-12).** All three endpoints now call `runAgentInference` (live provider chain + guard). `example_output.json` is now only the last-resort fallback when every provider fails. Was: static example for all agents.
4. **`ADAPTATION_HOST` differs by environment.** `127.0.0.1` for local dev, `0.0.0.0` on Railway. Easy to forget when copying `.env` to Railway dashboard.
5. **`FRONTEND_ORIGIN` must be an exact URL, never `*`.** Wildcard CORS is insecure for a deployed app with auth. Set it to the exact Railway frontend domain.
6. **`onboarding_drafts` removed from the pilot migration (RESOLVED 2026-06-11).** It referenced a non-existent `users(id)` table and, being inside the single BEGIN/COMMIT, rolled back ALL pilot tables on a clean DB. Removed for the pilot (draft persistence deferred). If reintroduced post-pilot, point the FK at `pilot_users(user_id)` (TEXT, not UUID). The frontend still calls `/pilot/onboarding/draft` (no such route) — that call is being dropped in Phase B.
7. **`agentOutputGuard.ts` IS now wired into the live route (RESOLVED 2026-06-12).** It runs as the `validate` callback inside `runAgentInference` — a guard failure makes the provider chain fall through to the next provider. It must stay in that chain.
8. **Rule priority order in policyEngine.ts differs from early docs.** Correct order (highest first): topic resistance → pivot interest → missed sessions → late night → completions. The order above reflects the actual engine.
9. **AI provider service (`aiProviderService.ts`) — now wired into the route via `agentInferenceRunner.ts` (updated 2026-06-12).** Chain order **OpenAI → Gemini → Anthropic** (cost/speed balance). 3 tiers: `fast`/`mid`/`deep` (default `mid`). All models env-overridable via `<PROVIDER>_MODEL_<TIER>`. Verify providers with `npm run smoke:ai`, end-to-end inference with `npm run smoke:agents`.
10. **Provider param quirks (encoded in the service — don't "fix" them back).** OpenAI gpt-5.x needs `max_completion_tokens`, NOT `max_tokens`. `temperature` is deprecated/rejected by Opus-4-8 & gpt-5.x → the service omits it unless explicitly set. Anthropic 404s on alias names (`*-latest`) → use exact dated IDs from `GET /v1/models`.
11. **Gemini 3 are "thinking" models.** Internal reasoning consumes the `maxOutputTokens` budget BEFORE the answer, so small budgets return empty output (default raised to 2048). `thinkingBudget:0` is rejected by pro ("only works in thinking mode"); `thinkingLevel:'low'` is accepted. Gemini pro latency is highly variable (3s–44s) with transient 503s — the reason it's second, not primary; the 60s timeout + fallback absorb it.
12. **Agent `system_instructions.md` do NOT contain the output schema.** They say "strict JSON matching schema" but the guard (`validateAgentOutput`) is strict (exact field sets, enums, lengths). The prompt MUST carry the shape — handled by `agentPromptSpecs.ts` (per-agent STRICT contract text) + the example, both embedded by `buildSystemPrompt`. `agentSpecConsistency.test.ts` asserts each `example_output.json` still passes the guard (drift guard).
13. **Output guard's prohibited-content filter was narrowed for the IT domain (2026-06-12).** Bare `/diagnos/` and `/prescribe/` blocked core technical vocabulary ("diagnose a network issue", "run diagnostics", "prescribed checklist") — they now match ONLY in medical/psychological collocation. The collocation noun list deliberately EXCLUDES tech-colliding words like "condition" (cf. "race condition"). If you re-add medical terms, keep them domain-safe. The guard is still the source of truth — keep `agentPromptSpecs.ts` in sync with it.

## Recent Context

**2026-05-08–10 (sessions 2–3):** Planning + knowledge infrastructure. No logic code changed. Decisions: real AI fallback, target users = service industry workers, Railway deploy. Created `.env` placeholders, `docs/INDEX.md`, `docs/understanding/` (4 docs); deleted `docs/breakdowns/`; fixed rule priority order; flagged gotchas 6–8.

**2026-06-13 (session 6): Phase B essentially COMPLETE — onboarding UI wired + restructured.** Wired the Claude-Design flow into `App.jsx` (Login → OnboardingFlow → PlanView → FirstSession → Closing); dropped server drafts (localStorage-only). Two live-walkthrough rounds drove: copy/UX fixes ("Bite-size wins," removed "—P"/"Resumed"/broken links, de-gated Risk step, reading-contradiction fix), then a **flow restructure** — AI now runs mid-flow via a new `Suggestions` track-picker right after the domains step; tracks stay **switchable** on the plan and propagate to the Professor session; first-session tasks are **selectable**; thumbs-down **regenerates**; added a **closing screen**. Backend guard relaxed to **3–6 career_options (rank 1–6)**. Whole flow verified live in the browser preview. Captured post-pilot direction "career-switch is a MODE; general learning engine" (`.ai/product-direction-multi-mode-learning.md` + memory). Resolved gotchas #1–2.

**2026-06-11/12 (sessions 4–5): Phase A COMPLETE — real AI end to end.** #1: built `aiProviderService.ts` (multi-provider fallback, raw fetch, 3 tiers, chain OpenAI→Gemini→Anthropic); live testing caught 5 provider quirks (gotchas 10–11). #2: `agentInferenceRunner.ts` orchestrator + wired into the route (config/contracts loaded once at boot, bounded 20s timeout, per-agent tiers, response `ai:{...}`, health `ai_configured`). #3: `agentPromptSpecs.ts` embeds each agent's strict contract; `agentSpecConsistency.test.ts` (drift guard) CAUGHT the professor example being wrongly rejected → narrowed the guard's `/diagnos/` & `/prescribe/` for the IT domain (gotcha #13, user-approved). Verified: 87/87 offline + `npm run smoke:agents` (all 3 agents produced real guard-valid output via OpenAI). Also fixed `onboarding_drafts` migration (gotcha #6); local Postgres 18 up + both migrations applied.

## Next Session Priorities

1. **Phase C (deploy)** — the main remaining lever to get real users in. Fill remaining `.env` (`FRONTEND_ORIGIN`, `RESEND_*`, `VITE_API_BASE_URL`, Railway `ADAPTATION_HOST=0.0.0.0`); create Railway project + run both migrations + smoke; add Dockerfile/nixpacks (none exists yet).
2. **Phase B polish** (small, optional pre-ship): Professor prompt sometimes echoes the raw enum "best_next" in user-facing copy → add a prompt line; delete dead `steps/Proof.jsx` + `steps/CoachReview.jsx`; clear stale `agent_output` if the user changes domains after the AI ran.
3. Fast-follow (post-pilot): scoped behavioral research; "Learn a Skill" mode. See `.ai/` strategic docs. Not pilot-blocking.

## Key Documentation

**Start with `docs/INDEX.md`** — it maps every doc to its use case so you only read what your task requires.

Critical reads (most tasks will need these):
- `.ai/behavioral-science-and-engine-alignment.md` — **read before Phase 4+ or any behavioral-rule work.** Maps the 11-principle behavioral doc vs. the 5-rule engine slice, flags unsourced thresholds + the "learning styles" myth, and sets the post-pilot research → operationalization → engine-build plan + rich-logging foundation.
- `docs/system_invariants_v1.md` — hard architectural constraints, non-negotiable
- `docs/behavioral_design_v1.md` — behavioral rules that drive adaptation logic
- `docs/project_onboarding_and_phase_guide.md` — phase map + local setup
- `docs/railway_pilot_deploy_guide.md` — Railway deployment
- `backend/docs/adaptation_troubleshooting_guide.md` — debugging the adaptation engine
- `backend/docs/adaptation_evaluations_migration_runbook.md` — DB migration procedures
