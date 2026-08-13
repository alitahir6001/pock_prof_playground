---
name: pocket-professor-runbook
description: Setup, run, config, and debugging for Pocket Professor - local setup from scratch, all commands, complete env-var catalog, symptom-to-triage table, the validation bar (what counts as proof), and a status diagnostic script. Triggers - "how do I run/start/test", server won't boot, CORS error, login code not showing, migration fails, build fails on Railway, AI returns fallback, tests fail, postgres connection refused, smoke tests, deploy checks.
---

# Pocket Professor — Runbook

**When NOT to use this skill:** rule/agent semantics → `pocket-professor-domain-reference`; design rationale → `pocket-professor-architecture-contract`; whether a change is allowed → `pocket-professor-change-control`; turning a hunch into a decision → `pocket-professor-evidence-and-analysis`.

## Instant status

```bash
bash .claude/skills/pocket-professor-runbook/scripts/status.sh
```
Read-only: toolchain, install/build state, .env key names, server health, DB tables + migration-004 check. (Verified working 2026-07-06.)

## Setup from scratch

1. Node 20+ (`node -v`), npm 10+, PostgreSQL running locally (founder's machine: EDB Postgres 18 at `/Library/PostgreSQL/18`, `psql` on PATH).
2. `cd backend && npm install` then `cd ../frontend && npm install`.
3. Root `.env` (already exists, gitignored; backend scripts load it via `--env-file=../.env`). Minimum to boot: `DATABASE_URL`, `ADAPTATION_DATABASE_URL` (same value), `ADAPTATION_PERSISTENCE_MODE=file` (or `postgres`), `PILOT_EXPOSE_DEV_CODE=true` (or the login code never shows locally).
4. `frontend/.env.local`: `VITE_API_BASE_URL=http://localhost:3040`.
5. Migrations (all four, in order):
```bash
cd backend
export ADAPTATION_DATABASE_URL='postgres://postgres:<pass>@localhost:5432/postgres'
npm run db:migrate:adaptation:up   # 001 adaptation_evaluations
npm run db:migrate:pilot:up        # 002 pilot_users/sessions/login_codes/interactions
npm run db:migrate:sprint:up       # 003 pilot_plans + pilot_sprint_days
npm run db:migrate:logincodes:up   # 004 attempts column (brute-force lockout)
```
Each has a matching `:down`. Raw SQL in `backend/db/migrations/`.

## Run locally

```bash
cd backend && npm run start:adaptation-runtime   # builds TS, boots Fastify on :3040
cd frontend && npm run dev                        # Vite on :5173
```
Login with any email; the on-screen dev code appears only with `PILOT_EXPOSE_DEV_CODE=true`. Admin portal: `http://localhost:5173/#admin`, log in as the `ADMIN_EMAIL` address.

**User preference (binding):** the founder runs servers and browses HIMSELF. Give him these commands; do not auto-start preview tools unless he asks.

## Command catalog (verified against package.json, 2026-07-06)

| Command (from `/backend`) | Does | Cost |
|---|---|---|
| `npm run build:phase3` | tsc → dist/ | free |
| `npm run test:phase3` | build + 14 test files, node:test | free, offline |
| `npm run start:adaptation-runtime` | build + boot server w/ ../.env | free |
| `npm run start:prod` | boot server, NO env file (Railway) | free |
| `npm run smoke:adaptation-runtime` | transport-boundary checks vs :3040 | free |
| `npm run start/smoke:adaptation-worker` | single worker job envelope | free |
| `npm run start/smoke:adaptation-broker-worker` | file-queue batch + telemetry | free |
| `npm run smoke:ai` | live provider chain (`AI_SMOKE_TIER=fast\|mid\|deep`) | **BILLABLE** |
| `npm run smoke:agents` | live inference, all 3 agents, guard-validated | **BILLABLE** |
| `npm run db:migrate:{adaptation,pilot,sprint,logincodes}:{up,down}` | psql migrations | free |

Frontend: `npm run dev` / `build` / `preview` / `start` (`serve -s dist -l ${PORT:-4173}`).

Single test: `cd backend && npm run build:phase3 && node --test dist/tests/adaptation/<file>.js`

## Env-var catalog (enumerated by grepping code, 2026-07-06)

Server (`run_adaptation_fastify.mjs` + engine): `DATABASE_URL`, `ADAPTATION_DATABASE_URL` (server requires one of them), `ADAPTATION_PERSISTENCE_MODE` (file|postgres), `ADAPTATION_AUDIT_FILE`, `ADAPTATION_PORT` (3040), `ADAPTATION_HOST` (127.0.0.1 local / 0.0.0.0 Railway), `FRONTEND_ORIGIN` (exact URL; prod boot refuses `*`/unset), `NODE_ENV` (=production enables prod guards), `ADAPTATION_INTERNAL_TOKEN` (gates /adaptation/evaluate in prod), `ADMIN_EMAIL` (admin portal; unset = admin disabled), `PILOT_EXPOSE_DEV_CODE` (LOCAL ONLY), `PILOT_LOGIN_CODE_TTL_MINUTES`, `PILOT_SESSION_TTL_HOURS`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.

AI (`aiProviderService.ts` + server): `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_REQUEST_TIMEOUT_MS` (default 20000), `AI_SMOKE_TIER` (smoke only), and per-model overrides `<OPENAI|GEMINI|ANTHROPIC>_MODEL` or `<PROVIDER>_MODEL_<FAST|MID|DEEP>`.

Workers: `ADAPTATION_WORKER_JOB_JSON`, `ADAPTATION_WORKER_MAX_ATTEMPTS` (3), `ADAPTATION_WORKER_IDEMPOTENCY_FILE`, `ADAPTATION_BROKER_{QUEUE,RETRY,DLQ,METRICS}_FILE`.

Frontend (browser-exposed — never secrets): `VITE_API_BASE_URL`.

Local-vs-Railway values: see the table in CLAUDE.md and `docs/railway_pilot_deploy_guide.md` (single home; not duplicated here).

## Symptom → triage

| Symptom | Likely cause / fix |
|---|---|
| Server throws `ADAPTATION_DATABASE_URL or DATABASE_URL is required` at boot | Root `.env` missing/empty, or you ran `start:prod` locally (it loads no env file) — use `start:adaptation-runtime` |
| Boot refuses: FRONTEND_ORIGIN error | `NODE_ENV=production` with `*`/unset origin — intentional guard (gotcha #15). Set the exact URL |
| Login code never appears on screen | `PILOT_EXPOSE_DEV_CODE` not `true` (local), or Resend unconfigured (prod). Intentional (gotcha #14) |
| 429 on login verify | Brute-force lockout: 8 failed attempts per TTL window, summed across codes. Wait out the TTL |
| Browser CORS error | `FRONTEND_ORIGIN` ≠ exact frontend URL (no trailing slash, no wildcard) |
| `psql: connection refused` | Local Postgres not running (EDB install at `/Library/PostgreSQL/18`); start it, then re-run status.sh |
| Pilot migration rolls everything back | Single BEGIN/COMMIT per file — one bad statement kills the whole file (bit us: gotcha #6) |
| Response has `ai.used_fallback: true` | All 3 providers failed (keys? guard rejecting output? timeouts?). Check server logs for per-attempt diagnostics; verify keys with `npm run smoke:ai` (billable) |
| AI output rejected repeatedly by guard | Spec drift: `agentPromptSpecs.ts` no longer mirrors `agentOutputGuard.ts`. Run `test:phase3` (agentSpecConsistency catches example drift) |
| Gemini empty output / 503 / slow | Thinking models eat token budget; latency 3s–44s. Known (gotcha #11) — chain absorbs it |
| Railway build: `tsc`/`vite` not found | `NODE_ENV=production` skipped devDeps; buildCommand must be `npm install --include=dev && npm run build` (gotcha #17) |
| Railway backend crash on `--env-file` | Wrong start script — prod must use `start:prod` (gotcha #17) |
| `tsc is not recognized` locally | `cd backend && npm install` |
| Tests compile but fail weird at runtime | Stale build: `rm -rf backend/dist && npm run test:phase3` |
| Black page background / overscroll | html/body bg set globally in `frontend/src/styles.css` — don't remove (gotcha #2) |

## Validation bar — what counts as evidence HERE

(Single home for this; change-control and evidence-and-analysis reference it.)

- **Backend logic:** `npm run test:phase3` at baseline. **Known baseline 2026-07-06: 86/87** — the one failure is a stale assertion in `agentInferenceRunner.test` ("EXACTLY 3" career_options wording, pre-relaxation). Any NEW failure is yours. Fixing that test restores 87/87.
- **Server/routes:** the matching smoke (`smoke:adaptation-runtime` for transport, curl for pilot routes) — the .mjs server has no unit tests.
- **Security changes:** verify the NEGATIVE path (401/403/429/refused boot), not just the happy path. Session-7 precedent: admin was verified as admin-200 / non-admin-403 / no-token-401 / unset-ADMIN_EMAIL-403.
- **AI/prompt/guard changes:** offline tests first (free); one bounded billable `smoke:agents` run only with user approval; never loop billable calls without an iteration cap + timeout.
- **Frontend behavior:** `npm run build` clean is necessary but NOT sufficient — behavior needs a user browser walkthrough (no automated frontend tests exist). Report "builds clean, walkthrough pending" honestly, as past sessions did.
- **Determinism claims:** same input twice → byte-identical output (worker smokes assert this).
- **"Deployed" means:** `GET /adaptation/health` returns 200 with `ai_configured:true` on Railway, 4 migrations applied, and one real email login → onboarding → plan → mark-day → reload-persists pass. Anything less is "prepped".

## Provenance and maintenance

Written 2026-07-06 at commit `9d16f26`. Node v22.23.1 / npm 10.9.8 / psql 18.2 on the founder's machine. Re-verify:
- Scripts drift: `cat backend/package.json | grep -A2 '"scripts"'` or just re-read it.
- Env catalog: `grep -rhoE "process\.env\.[A-Z_0-9]+" backend/src backend/scripts frontend/src | sort -u` and `grep -rhoE "import\.meta\.env\.[A-Z_0-9]+" frontend/src | sort -u`
- Test baseline: `cd backend && npm run test:phase3 2>&1 | tail -8`
- Status script: `bash .claude/skills/pocket-professor-runbook/scripts/status.sh`
