# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pocket Professor is a structured learning platform for career-switchers. The core is a **deterministic multi-agent adaptation engine** — no randomness, reproducible with the same inputs. Currently at Phase 3 (adaptation engine implementation), with Phases 4–6 planned.

**Current priority (as of 2026-07-12): DEPLOY, then launch the PAID pilot.** Deploy has been the sole remaining step since mid-June; validation latency is the project's #1 risk. Read "Honest Assessment & Path to Revenue" below before proposing new build work. See `.ai/current-task.md` for the launch plan and `.ai/handoff.md` for session state (incl. the founder's Wizard-of-Oz ops playbook).

## Honest Assessment & Path to Revenue (session 9, 2026-07-12)

Durable strategic verdict from a full project evaluation. Read before proposing ANY new build work: the default answer to "should we build X" is **no** until the paid pilot produces data.

**What works:** founder–market fit (15yr service industry, made the switch himself, warm bartender network = distribution nobody can copy); engineering quality (security pass, fail-closed patterns, drift-guard tests); persona-calibrated onboarding; the sprint loop + admin portal (the actual product core); honest self-documentation.

**What doesn't:** sequencing — Phases 0–3 predate all user contact; the deterministic engine is unwired speculative inventory with invented thresholds (the pilot deliberately runs Wizard-of-Oz instead); "based on real science" positioning is unearned (unsourced thresholds, no safety layer); no willingness-to-pay test existed anywhere until session 9; deploy has been "the next step" since mid-June — validation latency accrues daily. Also: retention for this demographic likely depends on the founder's personal touch, so a successful pilot may prove the founder retains users, not the app — design for and watch that distinction.

**Revised product thesis:** the moat is NOT plan generation (ChatGPT plans are free). It's **accountability + a believable path + someone in your corner**. The product is "a path with a person attached, where software gradually replaces the person." Never build curriculum: one track (IT support, CompTIA A+ as the spine, free existing content like Professor Messer) — sell the scaffolding: triage, daily sizing, the comeback loop, proof artifacts.

**Path to money, in order:**
1. Deploy. Founder self-pilots 2–3 days adversarially.
2. **PAID pilot:** ~10 users, $20–25 for the guided 2-week sprint, payment out-of-band (Stripe link/Venmo in the DM *before* they get the URL — also captures phone numbers; build no payments code). Charging is the commitment filter and the only retention signal that predicts revenue.
3. Founder IS the engine (the 5 rules as a manual SOP — see `.ai/handoff.md`) and hand-writes each finisher's **Exit Report** (day-14 artifact; the app deliberately dead-ends at "Sprint complete").
4. **One outcome story** (a user lands an interview/cert/job) is worth more than any feature.
5. Pilot data picks the branch: retention survives without the founder → consumer accountability product ($20–30/mo membership, later multi-mode); retention only WITH the founder → coaching/cohort business ($99–499 cohorts); strong retention but weak willingness-to-pay → **B2B/B2G workforce funding** ($2–5k/seat, WIOA-type; the admin portal becomes the buyer-facing product; year-2 play — requires outcome data first, never cold B2B sales as a solo founder).
6. Parallel, always: founder-story content on r/ITCareerQuestions, r/findapath, TikTok. The audience IS the marketing; funded competitors can't fake lived experience.

**Kill criteria (write down pre-launch, next to success thresholds):** e.g. <5 paying users after ~3 weeks of honest recruiting, or <2/10 returning past day 7 despite personal texts → stop or pivot hard. Honest founder check: if the daily texting is dreaded, this model dies regardless of data — near-term, founder-led coaching IS the product.

**Rejected pivots (don't re-litigate without new data):** top-to-bottom B2B worker-training rebuild (6–18mo sales cycles kill solo founders; B2G arrives later by pull, via outcome data); generic "AI upskilling app" (the most crowded framing; discards both real advantages — story and demographic access); trashing the idea pre-data (same error class as building for 8 months pre-data).

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

_(Refreshed 2026-07-12 — the old "JSON dev wizard" description was obsolete; see gotchas #1–2.)_

- `frontend/src/App.jsx` — the real user shell: Login → `OnboardingFlow` → `PlanView` (switchable tracks) → `DashboardView` (persisted sprint loop, one-session-per-day gate) → `SessionView` (per-day Professor). `#admin` hash → `AdminPortal` (founder cohort view). Mobile-first `max-w-[440px]`.
- `frontend/src/onboarding/` — wired flow: welcome→schedule→energy→skills→direction→suggestions (mid-flow AI track picker)→sprint→risk→trigger→done. Drafts are localStorage-only (`pp_onboarding_draft_v2`).
- `frontend/src/onboarding/tokens.css` — Tailwind v4 design tokens; imported via `styles.css` → `main.jsx`.
- **Known dead-end (deliberate):** day 14 shows "Sprint complete" with no artifact or next step (`App.jsx` ~:420). The pilot's day-14 Exit Report is founder-written, not built — see Honest Assessment.

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
| `RESEND_API_KEY` | — | from resend.com | required for email auth (prod has no dev_code fallback) |
| `RESEND_FROM_EMAIL` | — | verified sender address | must match Resend domain |
| `PILOT_EXPOSE_DEV_CODE` | `true` | **unset** | LOCAL ONLY — returns login code in API/logs. Setting in prod = auth bypass |
| `ADMIN_EMAIL` | your email | your email | founder-only admin portal (`#admin`); unset = admin disabled (fail-closed) |
| `ADAPTATION_INTERNAL_TOKEN` | — (open) | optional | gates `/adaptation/evaluate`; required in prod to use it (else disabled) |
| `NODE_ENV` | — | `production` | enables prod guards: refuse wildcard CORS, fail-closed evaluate |

## Key Constraints

- **Deterministic only** — identical inputs must produce identical outputs; no randomness anywhere
- **Fail-closed structural mutations** — audit record must persist before any curriculum graph change commits
- **Structural mutation cap** — max 1 per week per user
- **TypeScript strict mode** — required throughout backend
- **Agent output guard** — all agent responses must pass schema validation + content filtering before use

## Active Gotchas

_Numbered in discovery order. Never delete — only add._

1. **`OnboardingFlow.jsx` is now WIRED (RESOLVED 2026-06-13).** `App.jsx` is the real shell: Login → `OnboardingFlow` → `PlanView` → `FirstSessionView` → `ClosingView`. The flow runs the onboarding AI mid-flow (the `Suggestions` step) and is verified live. Dead files from the restructure (`steps/Proof.jsx`, `steps/CoachReview.jsx`) DELETED 2026-06-13 (session 7). Editing domains or the free-text note on the Direction step now clears `agent_output` so stale AI suggestions don't show on re-entry.
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
14. **Login `dev_code` is gated by `PILOT_EXPOSE_DEV_CODE` (security fix C1, 2026-06-14).** It used to be returned whenever email wasn't delivered → any prod email misconfig leaked the login code (auth bypass, incl. admin). Now ONLY returned when `PILOT_EXPOSE_DEV_CODE=true` (local dev). Without it, the on-screen code won't show — RESEND must be configured. NEVER set it in prod. Brute-force lockout: 8 failed verifies per TTL window (summed across codes so a fresh code can't reset) → 429; counter is the `attempts` column added by migration 004.
15. **Prod security guards key on `NODE_ENV=production` (2026-06-14).** Boot REFUSES to start if `FRONTEND_ORIGIN` is `*`/unset; `/adaptation/evaluate` becomes fail-closed (requires `ADAPTATION_INTERNAL_TOKEN`, else disabled). Must set `NODE_ENV=production` on Railway or these guards stay off. Locally evaluate is open so its smoke (`smoke_adaptation_runtime.sh`) still passes unchanged.
16. **Admin portal is server-enforced, not UI-hidden (2026-06-14).** Frontend `#admin` route → `AdminPortal`; backend `GET /pilot/admin/cohort` via `requireAdmin` = valid session whose email === `ADMIN_EMAIL` (fail-closed if unset). It's a normal pilot login gated by email, so the founder logs in like any user. Login codes use `crypto.randomInt` (not `Math.random`).
17. **Railway deploy: `NODE_ENV=production` + `npm install` SKIPS devDependencies (2026-06-14).** We require `NODE_ENV=production` for the security guards (gotcha #15), but that makes a plain `npm install` omit devDeps → `typescript` (backend) and `vite` (frontend) vanish → build fails. Both `railway.json` buildCommands use `npm install --include=dev && npm run build` to force them. Both services deploy via **Nixpacks, no Dockerfile** (one Railway project, frontend served static via `serve -s dist -l $PORT`). Backend prod start is `start:prod` (`node scripts/run_adaptation_fastify.mjs`) — NOT `start:adaptation-runtime`, whose `--env-file=../.env` crashes on Railway (no such file; env is injected). The `#admin` hash route means the static host needs NO SPA-fallback config.

## Recent Context

**2026-07-03 + 2026-07-12 (sessions 8–9): strategy — pilot design + honest evaluation. NO code.** Session 8: do NOT wire the engine — **Wizard-of-Oz** it (founder manually intervenes via the admin portal when a rule would fire; interventions calibrate the unsourced thresholds); pilot judged on the **retention loop** with pre-written numeric thresholds; sequence = deploy → founder self-pilots 2–3 days adversarially → recruit (warm bar network + Reddit DMs to hand-raisers, founder-story pitch); subdomain on `pakfro.dev` (Porkbun CNAME); AI spend caps pre-launch. Session 9: full evaluation → the "Honest Assessment & Path to Revenue" section above. Pilot became **PAID** ($20–25 out-of-band via payment link in the DM, which also captures phone numbers); day-14 artifact = manual founder-written **Exit Report**; founder ops SOP = the 5 engine rules humanized + an **intervention log** (spreadsheet) that later calibrates the engine; **kill criteria** to be written before the first user; rejected: B2B rebuild, generic AI-upskilling pivot, and trashing the idea pre-data.

**2026-06-13–14 (session 7): onboarding polish + Sprint Loop + admin portal + security pass + deploy prep.** Polished onboarding (enum-echo fix, deleted dead Proof/CoachReview, clear stale AI on domain edits, fixed blank hero logo, skills 10→15 in 3-col grid, relabeled "Open dashboard"). A walkthrough exposed the flow dead-ending at onboarding + one in-memory task → built **Phase B2 Sprint Loop**: `pilot_plans`+`pilot_sprint_days` (migration 003), plan/track/day routes (track-switch keeps progress, re-onboard wipes), real DashboardView with returning-user load + per-day Professor sessions + one-per-day gate + Suggestions escape hatch — so "do users return" is finally measurable. Built a founder-only **admin cohort portal** (`#admin`, `ADMIN_EMAIL`-gated, fail-closed). **Pre-deploy security pass** (gotchas #14–16): fixed dev_code leak, login brute-force lockout (migration 004), wildcard-CORS prod refusal, gated `/adaptation/evaluate`, CSPRNG codes; SQL/XSS verified clean. **Deploy prep** (all-Railway, Nixpacks, no Dockerfiles; gotcha #17): `railway.json`×2, `start:prod`, static `serve`, `--include=dev` for the NODE_ENV devDep skip. Backend + builds verified; frontend not browser-walked. Deploy + walkthrough + Resend are the user's closing actions (next session: confirm live health, don't redo prep).

**2026-06-13 (session 6): Phase B complete.** Claude-designed onboarding wired into `App.jsx`; AI moved mid-flow (`Suggestions` track picker); switchable tracks propagate to Professor; thumbs-down regenerates; closing screen; guard relaxed to 3–6 career_options. Verified live in preview. Multi-mode direction captured in `.ai/product-direction-multi-mode-learning.md`. Resolved gotchas #1–2.

**2026-06-11/12 (sessions 4–5): Phase A complete — real AI end to end.** `aiProviderService.ts` (OpenAI→Gemini→Anthropic fallback, 3 tiers) + `agentInferenceRunner.ts` wired into the live route with the guard as `validate` callback; drift-guard test caught the professor example being wrongly rejected → guard narrowed for IT domain (gotchas #10–13). 87/87 offline + live `smoke:agents`. Fixed `onboarding_drafts` migration; local Postgres 18 up. Ship-first decision captured in `.ai/behavioral-science-and-engine-alignment.md`.

**2026-05-08–10 (sessions 2–3):** Planning + knowledge infra. Decisions: real AI fallback, target = service industry workers, Railway. Created `docs/INDEX.md`, `docs/understanding/`; flagged gotchas 6–8.

## Next Session Priorities

1. **Confirm the deploy is live** (user drives Railway; sessions 7–8 work must be committed + pushed first — see `.ai/current-task.md` for the full step list). Then support the founder self-pilot: fix what it surfaces (bugs/copy only, no features).
2. **Pre-launch checklist (user):** AI spend caps on all 3 provider dashboards; success thresholds + kill criteria written in one doc before the first user; payment link ready; subdomain + Resend domain verification.
3. **During the pilot:** founder runs the Wizard-of-Oz ops playbook (SOP in `.ai/handoff.md`); Claude's job is analysis of the intervention log + small fixes — nothing new gets built until pilot data exists.
4. Post-pilot pile (gated on data): wire the engine with log-calibrated thresholds (candidate design: append-only event journal + deterministic tick + replay/backtesting — evaluated session 9, deliberately deferred; never pre-pilot); progression ladder; prompt-injection hardening; behavioral research; multi-mode.

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
