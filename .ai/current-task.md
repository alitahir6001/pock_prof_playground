# Current Task

**Phase C — Deploy to Railway (get the pilot in front of real users)**
Last updated: 2026-06-13

## What
Phase A (real AI) and Phase B (the user-facing onboarding flow) are done and verified locally end-to-end. The last lever to get real testers in is **deployment**.

Steps:
1. Fill the remaining `.env` values: `FRONTEND_ORIGIN` (exact Railway frontend URL, no wildcard), `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (so login codes actually email — dev code stops showing once set), `VITE_API_BASE_URL` (exact Railway backend URL, in the frontend's env). On Railway set `ADAPTATION_HOST=0.0.0.0`.
2. Create the Railway project: Postgres plugin + backend service (root `/backend`) + frontend service (root `/frontend`).
3. Add a Dockerfile or nixpacks config — **none exists yet** for either service.
4. Run both migrations against Railway Postgres (`db:migrate:pilot:up`, `db:migrate:adaptation:up`).
5. Smoke the deployed URL: `GET /adaptation/health`, then the full auth → onboarding → agent flow.

See `docs/railway_pilot_deploy_guide.md`.

## Why
Everything works locally; real users can't reach it. Deployment is what turns "it works on my machine" into "service-industry testers can try it."

## Optional pre-ship polish (Phase B nits — quick, not blocking)
- Professor prompt sometimes echoes the raw enum "best_next" in user-facing "next actions" → add a prompt line to use plain task descriptions.
- Delete dead files: `frontend/src/onboarding/steps/Proof.jsx`, `steps/CoachReview.jsx`.
- Clear stale `agent_output` if the user changes domains after the AI suggestions ran.

## Out of scope (post-pilot)
- Scoped behavioral research + operationalization (`.ai/behavioral-science-and-engine-alignment.md`).
- "Learn a Skill" mode / multi-mode learning (`.ai/product-direction-multi-mode-learning.md`).
- Phases 4–6.

## Required reading before starting
- `.ai/handoff.md`
- `docs/railway_pilot_deploy_guide.md`
- CLAUDE.md env-var table + gotchas #4 (`ADAPTATION_HOST`), #5 (`FRONTEND_ORIGIN` exact URL)
