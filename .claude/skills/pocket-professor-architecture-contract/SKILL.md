---
name: pocket-professor-architecture-contract
description: Load-bearing design decisions of Pocket Professor and WHY - the .mjs shell vs compiled TS split, provider-chain design, persistence adapters, fail-closed transactions, auth model, frontend state machine, known-weak points. Triggers - "why is it built this way", adding routes or modules, restructuring, moving code, choosing where new logic lives, evaluating tech debt, planning Phase 4+, wiring the adaptation engine, replacing the .mjs server.
---

# Pocket Professor — Architecture Contract

The decisions that hold the system up, why they were made, and where it is known to be weak. If a change would violate a decision here, route through `pocket-professor-change-control` first.

**When NOT to use this skill:** running/debugging → `pocket-professor-runbook`; rule/agent semantics → `pocket-professor-domain-reference`.

## System shape (verified 2026-07-06)

```
frontend (React 18 + Vite 5, JSX, no TS, Tailwind v4 CSS-first)
  App.jsx = the whole shell/state machine (~1 file):
    Login → OnboardingFlow → PlanView → DashboardView → SessionView
    #admin hash route → AdminPortal
  onboarding/ = 10-step flow, AI runs MID-flow (Suggestions step)
  api.js → fetch → VITE_API_BASE_URL
        │
backend (TypeScript 5.6 strict ESM → dist/; Node 20+, Fastify 5, pg)
  scripts/run_adaptation_fastify.mjs  ← THE server (613 lines, plain JS)
    imports compiled TS from dist/ for engine + AI + guard
    all pilot routes, auth, plan persistence, admin — inline SQL via pg Pool
  src/modules/adaptation/phase3/  ← deterministic engine (pure TS, tested)
  src/modules/agents/phase2/      ← contracts + ai/ (provider chain, runner, specs)
        │
PostgreSQL (only DB; no SQLite/in-memory) — 4 raw-SQL migrations
```

## Load-bearing decisions and their rationale

1. **The `.mjs` server is deliberately outside the TS build.** `run_adaptation_fastify.mjs` is hand-written JS importing compiled TS from `dist/`. Why: the TS modules are pure, deterministic, and unit-tested; the server is glue that changed fast during pilot build-out. Consequence: the server has NO unit tests — its verification is smokes + curl (see runbook). Don't move server logic into TS mid-task "to clean up"; that's a rewrite decision for the user.

2. **Pure core, effectful edges.** `policyEngine.ts` is a pure evaluator (no I/O); `adaptationEvaluationService.ts` orchestrates evaluator → record → persist; `adaptationEvaluationPersistence.ts` owns the transaction. Determinism is testable ONLY because side effects live at the edge. New engine logic must keep this split.

3. **Fail-closed audit transaction.** Structural mutations commit only after the audit record persists. Rationale: an unaudited curriculum change is unacceptable in a product whose pitch is auditable adaptation (`docs/system_invariants_v1.md` — hard constraints, non-negotiable).

4. **Persistence adapter pair.** `ADAPTATION_PERSISTENCE_MODE=file|postgres` selects between `adaptationEvaluationFileAdapter.ts` and `adaptationEvaluationPostgresAdapter.ts` behind one interface. Why: local dev without Postgres, identical semantics in prod. New persistence features must land in BOTH adapters or explicitly document the gap.

5. **Provider chain, raw fetch, no SDKs** (`aiProviderService.ts`). OpenAI → Gemini → Anthropic ordered by cost/speed; keyless providers skipped; any failure (http/timeout/parse/guard) falls through; `AiAllProvidersFailedError` only when all fail. No SDKs → no dependency drift, injectable fetch → fully offline-testable. The `validate` callback is the designed seam where the output guard plugs in — never bypass it.

6. **Graceful AI degradation, never a 500.** Runner falls back to `example_output.json` (`used_fallback:true` surfaced in the response `ai:{}` block). A pilot user always gets *something*; telemetry says whether it was real.

7. **Auth: email code → opaque session token.** Codes via Resend, `crypto.randomInt`, TTL'd, brute-force capped (8 fails/TTL window, summed across codes → 429). Sessions: 122-bit tokens stored hashed. Admin = a normal pilot login whose email equals `ADMIN_EMAIL`, enforced server-side per request (`requireAdmin`), fail-closed when unset. Why no separate admin auth: n=10 pilot, founder-only, less code = less attack surface.

8. **Plan persistence semantics** (session 7): one plan row per user (UNIQUE user_id); `POST /pilot/plan` = full replace and WIPES sprint days (re-onboarding); `POST /pilot/plan/track` = metadata-only, KEEPS days (track switch); `POST /pilot/plan/day` idempotent via ON CONFLICT. `completed_at` on `pilot_sprint_days` is the pilot's core retention datum.

9. **Frontend state machine over router.** Views switch on state in `App.jsx` (+ one `#admin` hash route). Why: no SPA-fallback config needed on static hosting (gotcha #17), trivially small. Drafts are localStorage-only (`pp_onboarding_draft_v2`) — server-side drafts were removed (gotcha #6).

10. **Deploy: one Railway project, Nixpacks, no Dockerfiles.** Backend service root `/backend`, frontend root `/frontend` served by `serve -s dist`. `railway.json` in each pins `npm install --include=dev && npm run build` (NODE_ENV=production would otherwise strip typescript/vite). Backend prod start = `start:prod` (no `--env-file`; Railway injects env). Status 2026-07-06: **prepped, NOT yet deployed.**

## Invariants that must hold

- Determinism in the engine (no clocks, randomness, or ambient state inside evaluation; `evaluated_at` is an input).
- Fail-closed structural mutation persistence.
- Structural mutation cap: max 1/week/user, excess deferred (not dropped) with `STRUCTURAL_CAP_REACHED`.
- Guard in the inference chain; spec text (`agentPromptSpecs.ts`) mirrors the guard.
- `/plan` vs `/plan/track` wipe/keep split.
- Prod boot refuses wildcard/unset `FRONTEND_ORIGIN`; `/adaptation/evaluate` fail-closed in prod.
- TypeScript strict everywhere under `backend/src`.

## Known-weak points (stated plainly)

- **The .mjs server is a 613-line single file with inline SQL and no unit tests.** Fine at pilot scale; the first thing to buckle if the product grows. Its only safety nets are smokes and the strict TS modules it delegates to.
- **The adaptation engine is unwired inventory.** No frontend signal collection, no caller of `/adaptation/evaluate`. The headline feature is speculative until pilot data justifies wiring it (deliberate, session 8).
- **Schedule/energy onboarding data is placebo.** Collected and stored, feeds one LLM ranking, nothing downstream reads it. A cheap post-deploy win is using it to time nudges.
- **No rate limiting on AI routes** — cost control is spend caps on the three provider dashboards (must be set before strangers get the URL).
- **Prompt-injection hardening is deferred** (assessed LOW: schema-guarded, escaped, single-tenant).
- **One stale test**: `agentInferenceRunner.test` asserts pre-relaxation "EXACTLY 3" career_options wording → suite baseline 86/87 (found 2026-07-06).
- **Frontend has zero automated tests**; verification is builds + user walkthroughs.

## Provenance and maintenance

Written 2026-07-06 at commit `9d16f26`. Re-verify:
- Server size/routes: `wc -l backend/scripts/run_adaptation_fastify.mjs && grep -n "app\.\(get\|post\)" backend/scripts/run_adaptation_fastify.mjs`
- Adapter pair: `ls backend/src/modules/adaptation/phase3/ | grep Adapter`
- Deploy status: check `.ai/current-task.md` and `.ai/handoff.md` (they lead; this file lags).
- Invariant doc: `docs/system_invariants_v1.md`
