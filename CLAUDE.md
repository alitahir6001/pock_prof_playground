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

Agents use a Gemini → OpenAI → Claude fallback chain. All three API keys are required as env vars. Currently agents return static `example_output.json` — AI wiring is the next backend task.

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
| `GEMINI_API_KEY` | — | from Google AI Studio | primary AI provider |
| `OPENAI_API_KEY` | — | from platform.openai.com | first fallback |
| `ANTHROPIC_API_KEY` | — | from console.anthropic.com | second fallback |
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

1. **`OnboardingFlow.jsx` is orphaned.** The full multi-step onboarding UI exists at `frontend/src/onboarding/` but is not imported or used in `App.jsx`. Do not assume it's wired — it isn't yet.
2. **Design tokens are wired, but `App.jsx` isn't the right shell.** `tokens.css` is correctly imported via `styles.css` → `main.jsx` and token classes work. But `App.jsx` is a developer wizard, not a user-facing app. The tokens being wired doesn't mean the UX is ready.
3. **Agents return static JSON.** All three agent endpoints (`onboarding_agent`, `professor_agent`, `career_coach_agent`) return `example_output.json` — real AI is not wired. `agentOutputGuard.ts` must stay in the call chain when real AI is wired in.
4. **`ADAPTATION_HOST` differs by environment.** `127.0.0.1` for local dev, `0.0.0.0` on Railway. Easy to forget when copying `.env` to Railway dashboard.
5. **`FRONTEND_ORIGIN` must be an exact URL, never `*`.** Wildcard CORS is insecure for a deployed app with auth. Set it to the exact Railway frontend domain.
6. **`onboarding_drafts` table has a broken FK.** It references a `users(id)` table that doesn't exist yet. This will cause a migration error on a clean DB. Needs to be dropped or fixed before Phase 4 adds the `users` table. See `docs/understanding/data-model.md`.
7. **`agentOutputGuard.ts` is not currently called in the agent route handler.** It exists and is tested, but is not wired into the live route. Must be connected when real AI is wired in — it's the safety net for malformed AI responses.
8. **Rule priority order in policyEngine.ts differs from early docs.** Correct order (highest first): topic resistance → pivot interest → missed sessions → late night → completions. The order above reflects the actual engine.

## Recent Context

**2026-05-08–10 (sessions 2–3):** Planning + knowledge infrastructure. No logic code changed. Key decisions: real AI (Gemini → OpenAI → Claude fallback), target users are service industry workers, Railway deploy. Created `.env` with all placeholders. Fixed `railway_pilot_deploy_guide.md` (missing AI keys, RESEND marked optional instead of required, missing TTL vars). Updated `project_onboarding_and_phase_guide.md` to reflect Phase 3 complete. Created `docs/INDEX.md` and `docs/understanding/` (4 mental model docs). Deleted `docs/breakdowns/`. Fixed rule priority order in CLAUDE.md — was listed wrong. Flagged `agentOutputGuard.ts` not wired in live route (gotcha #7) and `onboarding_drafts` broken FK (gotcha #6). User is about to fill `.env` — that's the gate for all remaining work.

## Next Session Priorities

1. **[USER ACTION FIRST]** Fill `.env` — Railway DB URL, Resend keys, Gemini/OpenAI/Anthropic keys
2. Wire Gemini → OpenAI → Claude fallback into all three agent endpoints; wire `agentOutputGuard.ts` into route handler
3. Integrate `OnboardingFlow.jsx` into `App.jsx`; build professor + career-coach form UIs to match token style
4. Replace raw JSON output with human-readable cards; remove debug line (`App.jsx:132`)
5. Fix `onboarding_drafts` broken FK before running migrations on clean DB
6. Railway project creation + both migrations + smoke tests

## Key Documentation

**Start with `docs/INDEX.md`** — it maps every doc to its use case so you only read what your task requires.

Critical reads (most tasks will need these):
- `docs/system_invariants_v1.md` — hard architectural constraints, non-negotiable
- `docs/behavioral_design_v1.md` — behavioral rules that drive adaptation logic
- `docs/project_onboarding_and_phase_guide.md` — phase map + local setup
- `docs/railway_pilot_deploy_guide.md` — Railway deployment
- `backend/docs/adaptation_troubleshooting_guide.md` — debugging the adaptation engine
- `backend/docs/adaptation_evaluations_migration_runbook.md` — DB migration procedures
