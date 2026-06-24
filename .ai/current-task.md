# Current Task

**Phase C — Deploy to Railway (one platform: backend + frontend + Postgres)**
Last updated: 2026-06-14 (session 7)

## What
Everything works locally and is verified: onboarding → AI picker → plan → persisted sprint loop → dashboard → return path; founder admin portal (`#admin`); pre-deploy security pass (5 fixes). Deploy PREP is done (Nixpacks config, no Dockerfiles). Remaining = the Railway dashboard steps + migrations + smoke.

Decisions locked: all on Railway (one project/bill); Nixpacks (no Dockerfiles); frontend served static via `serve`.

## Steps remaining
1. **Push the branch to GitHub** (Railway deploys from the repo). Lots of uncommitted session-7 work — commit + push first (ask user before committing).
2. **Railway project:** Postgres plugin + backend service (root `/backend`) + frontend service (root `/frontend`). `railway.json` in each pins build/start.
3. **Env vars** (see `docs/railway_pilot_deploy_guide.md`): backend needs `NODE_ENV=production`, `DATABASE_URL`/`ADAPTATION_DATABASE_URL`, `ADAPTATION_PERSISTENCE_MODE=postgres`, `ADAPTATION_HOST=0.0.0.0`, `ADAPTATION_PORT=${{PORT}}`, exact `FRONTEND_ORIGIN`, `ADMIN_EMAIL`, `RESEND_*`, AI keys. Frontend needs `VITE_API_BASE_URL` (exact backend URL). Do NOT set `PILOT_EXPOSE_DEV_CODE` in prod.
4. **Run the 4 migrations** against Railway Postgres: adaptation, pilot, sprint, logincodes.
5. **Smoke:** `GET /adaptation/health` (expect `ai_configured:true`), then real email login → onboarding → plan → dashboard → mark a day → reload persists. Check `#admin` works for the founder email.

## Watch out for (verified gotchas)
- Prod start = `start:prod` (no `--env-file`); build = `npm install --include=dev && npm run build` (NODE_ENV=production skips devDeps otherwise — gotcha #17).
- Boot REFUSES wildcard `FRONTEND_ORIGIN` in prod (gotcha #15). RESEND required (no dev_code in prod — gotcha #14).

## Recommended before deploy
User walkthrough of B2 + admin locally for final UX feedback (not strictly blocking).

## Out of scope (post-pilot)
Progression ladder; schedule/energy→real adaptation + wiring the engine; prompt-injection hardening; behavioral research; multi-mode learning. Phases 4–6.

## Required reading
- `docs/railway_pilot_deploy_guide.md` (updated this session)
- CLAUDE.md env table + gotchas #14–17
- `.ai/handoff.md`
