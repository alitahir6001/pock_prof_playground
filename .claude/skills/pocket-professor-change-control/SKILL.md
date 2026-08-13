---
name: pocket-professor-change-control
description: How changes are classified, gated, and recorded in Pocket Professor. Read BEFORE editing backend logic, the agent guard, prompts, migrations, env handling, or anything security-adjacent. Triggers - "can I change X", "refactor", "clean up", "this looks wrong let me fix it", touching agentOutputGuard, aiProviderService, policyEngine, migrations, CORS, dev_code, NODE_ENV, gotchas, session wrap-up, updating CLAUDE.md or .ai/ files.
---

# Pocket Professor — Change Control

Solo-founder repo, no CI, no PR review. Discipline is enforced by convention + tests + this document, not tooling. That makes the written rules MORE binding, not less: nothing catches you if you break them.

**When NOT to use this skill:** for "how do I run/debug X" use `pocket-professor-runbook`; for "why is it designed this way" use `pocket-professor-architecture-contract`; for domain rules/agent semantics use `pocket-professor-domain-reference`.

## Change classes

| Class | Examples | Gate |
|---|---|---|
| **Docs / .ai/ upkeep** | handoff.md, backlog.md, CLAUDE.md | Follow `.ai/RULES.md` exactly (see below) |
| **Frontend UX** | copy, steps, layout | Build clean (`npm run build` in `/frontend`) + user walkthrough for behavior. User runs servers/browser HIMSELF — do not auto-launch preview tools |
| **Backend logic** | routes, services, engine | `npm run test:phase3` green (baseline: 86/87, see runbook) + relevant smoke |
| **Guard / prompts** | agentOutputGuard.ts, agentPromptSpecs.ts | Must keep spec↔guard in sync; `agentSpecConsistency.test.ts` is the drift guard. Billable verification (`smoke:agents`) only with user approval |
| **Migrations** | backend/db/migrations/ | New numbered file pair (up+down), own BEGIN/COMMIT, npm script pair, apply locally, update the "N migrations" count everywhere it appears |
| **Security-adjacent** | auth, CORS, dev_code, admin, tokens | Fail-closed by default; verify the negative path (401/403/refused-boot), not just the happy path |
| **Structural / irreversible** | deleting files, schema drops, deploys, commits | Ask the user first. Never commit/push unprompted |

## Non-negotiables, each with its incident

1. **Determinism everywhere in the engine.** Identical inputs → identical outputs; no randomness in `backend/src/modules/adaptation/`. Rationale: auditable adaptation is the product's core claim (`docs/system_invariants_v1.md`). The one permitted randomness is `crypto.randomInt` for login codes — and that exists because `Math.random` codes were flagged insecure in the session-7 security pass (fix M2).

2. **Fail-closed structural mutations.** A curriculum-graph change must NOT commit if its audit record fails to persist (`adaptationEvaluationPersistence.ts`). This is a Phase-1 invariant; tests cover it. Never "optimize" the transaction order.

3. **The guard stays in the inference chain.** `agentOutputGuard.ts` runs as the `validate` callback inside `runAgentInference` — a guard failure makes the provider chain fall through to the next provider. Incident: before 2026-06-12 the route served static example output; wiring the guard in is what made real AI safe to ship (gotchas #3, #7).

4. **Guard and prompt specs move together.** The agents' `system_instructions.md` do NOT contain the output schema; `agentPromptSpecs.ts` carries the strict contract text. Incident: the drift-guard test caught the professor example being wrongly rejected because the bare `/diagnos/` pattern blocked IT vocabulary ("diagnose a network issue") — the pattern was narrowed to medical collocations only, user-approved (gotchas #12–13). If you touch the guard, update the spec text and run `test:phase3`.

5. **Don't "fix" the provider quirks back.** `max_completion_tokens` for gpt-5.x, omitted `temperature`, Gemini thinking-budget 2048, Anthropic exact dated model IDs — each was a live failure discovered in session 4 (gotchas #10–11). They look like mistakes; they are fixes.

6. **Migrations: own transaction, correct FKs.** Incident (gotcha #6): `onboarding_drafts` referenced a non-existent `users(id)` table inside the single BEGIN/COMMIT of the pilot migration and silently rolled back ALL pilot tables on a clean DB. Any FK to users points at `pilot_users(user_id)` (TEXT, not UUID).

7. **`POST /pilot/plan` wipes days; `POST /pilot/plan/track` keeps them.** Deliberate split (session 7): track-switch must NOT destroy sprint progress; re-onboarding must. Never merge these routes.

8. **Never set `PILOT_EXPOSE_DEV_CODE` outside local dev.** Incident (gotcha #14, fix C1): the login code used to be returned whenever email delivery failed — any prod email misconfig became a full auth bypass, including admin.

9. **Prod guards key on `NODE_ENV=production`** (refuse wildcard CORS, fail-closed `/adaptation/evaluate`). And `NODE_ENV=production` makes `npm install` skip devDeps — which broke builds until `--include=dev` was pinned in both `railway.json`s (gotchas #15, #17). If you touch build commands, keep `--include=dev`.

10. **Gotchas in CLAUDE.md are append-only, numbered.** Never delete or renumber. Next free number: check CLAUDE.md (currently 17 as of 2026-07-06).

## Session bookkeeping (binding — from `.ai/RULES.md`)

- `.ai/handoff.md` — rewrite sections in place CONTINUOUSLY as state changes (not a log). Cap 150 lines.
- `.ai/current-task.md` — edit only on task transitions.
- `.ai/backlog.md` — prepend one entry at session END only.
- `CLAUDE.md` — gotchas when discovered; Recent Context + Next Session Priorities at session end. Cap ~200–250 lines; compress old sessions, never delete gotchas.
- Don't duplicate handoff content into CLAUDE.md; don't write tutorials into CLAUDE.md.

## Spending & user-preference gates

- **Billable AI calls** (`smoke:ai`, `smoke:agents`, live route hits) cost real money across 3 providers. Run only when needed to verify a prompt/guard change, prefer `AI_SMOKE_TIER=fast`, and never in an unbounded loop (user memory: cap iterations + timeout on anything billable).
- **No auto-preview.** The user runs servers and browses himself; give him the commands (runbook §Run locally).
- **Commits:** batch, ask first, never push to Railway-connected `main` casually once deployed (deploys are triggered from the repo).

## What counts as evidence

Stated fully in `pocket-professor-runbook` §Validation bar (single home). Short form: build green + `test:phase3` at baseline + the smoke matching the change class + negative-path checks for security code + user walkthrough for UX behavior.

## Provenance and maintenance

Written 2026-07-06 at commit `9d16f26` (not yet deployed to Railway). Re-verify:
- Gotcha count / next number: read CLAUDE.md §Active Gotchas (last entry's number + 1; 17 as of 2026-07-06).
- Test baseline: `cd backend && npm run test:phase3 2>&1 | tail -8` (86/87 pass as of 2026-07-06; see runbook for the known failure).
- Route split still intact: `grep -n "app.post('/pilot/plan" backend/scripts/run_adaptation_fastify.mjs` (expect 3 distinct routes: `/plan`, `/plan/track`, `/plan/day`).
- `.ai/RULES.md` still the bookkeeping source: `ls .ai/`.
