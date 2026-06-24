# Railway Pilot Deploy Guide (React frontend + Fastify backend + Postgres)

## Goal
Get Pocket Professor into a pilot-ready state for 1-12 users with:
1. email-only login,
2. multi-step agent wizard,
3. feedback capture per component,
4. persisted data in Railway Postgres.

## Architecture
- Frontend: `frontend/` React (Vite)
- Backend: `backend/scripts/run_adaptation_fastify.mjs`
- Database: Railway Postgres (`ADAPTATION_DATABASE_URL`)

## 1) Railway setup
1. Create a new Railway project.
2. Add a **Postgres** service.
3. Add a **Backend API** service (connect your repo, root dir `backend`).
4. Add these env vars on backend service:
   - `NODE_ENV=production` (**required** — turns on the security guards: refuses wildcard CORS, fail-closes the internal endpoint)
   - `DATABASE_URL` (from Railway Postgres `DATABASE_URL`)
   - `ADAPTATION_DATABASE_URL` (same value as `DATABASE_URL`)
   - `ADAPTATION_PERSISTENCE_MODE=postgres`
   - `ADAPTATION_HOST=0.0.0.0`
   - `ADAPTATION_PORT=${{PORT}}`
   - `FRONTEND_ORIGIN=https://<your-frontend-domain>` (exact URL, no trailing slash, no wildcard — boot fails in prod if this is `*`)
   - `ADMIN_EMAIL=<your email>` (founder-only admin portal at `<frontend>/#admin`; unset = admin disabled)
   - `PILOT_SESSION_TTL_HOURS=720`
   - `PILOT_LOGIN_CODE_TTL_MINUTES=15`
   - `RESEND_API_KEY=<required — login is broken without it; there is NO dev_code fallback in prod>`
   - `RESEND_FROM_EMAIL=<required — must match a verified Resend sender>`
   - `OPENAI_API_KEY=<required — primary AI provider; chain is OpenAI → Gemini → Anthropic>`
   - `GEMINI_API_KEY=<required — first fallback>`
   - `ANTHROPIC_API_KEY=<required — last fallback (most expensive)>`
   - Do **NOT** set `PILOT_EXPOSE_DEV_CODE` in production (it leaks login codes). `ADAPTATION_INTERNAL_TOKEN` is optional (only needed if you call `/adaptation/evaluate` directly).

## 2) Backend deploy settings
- Build Command: `npm install && npm run build:phase3`
- Start Command: `npm run start:adaptation-runtime`

## 3) Run migrations
From your machine (or Railway shell):

Run ALL FOUR migrations, in order:

```bash
cd backend
export ADAPTATION_DATABASE_URL='<railway postgres url>'
npm run db:migrate:adaptation:up
npm run db:migrate:pilot:up
npm run db:migrate:sprint:up        # pilot_plans + pilot_sprint_days
npm run db:migrate:logincodes:up    # login brute-force lockout (attempts col)
```

## 4) Frontend deployment
You can deploy `frontend/` to Vercel/Netlify/Railway static.

Required env var:
- `VITE_API_BASE_URL=https://<your-backend-service-domain>`

Build commands:
```bash
cd frontend
npm install
npm run build
```

## 5) Smoke checks in deployed env
1. Health:
```bash
curl https://<backend-domain>/adaptation/health
```
2. Login code request:
```bash
curl -X POST https://<backend-domain>/pilot/auth/email/request \
  -H 'content-type: application/json' \
  -d '{"email":"pilot@example.com"}'
```
3. Verify code and run an agent from frontend.

## 6) Pilot checklist (go/no-go)
- [ ] Backend health is 200.
- [ ] Login code request + verify works.
- [ ] Wizard runs onboarding/professor/career-coach endpoints.
- [ ] Feedback saves for each step.
- [ ] Interaction and feedback rows appear in Postgres.
- [ ] One real pilot user can login, run flow, and resume later.
