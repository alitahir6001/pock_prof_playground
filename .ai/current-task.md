# Current Task

**Pilot Readiness — Tier 1 + Tier 2: Env Vars → AI Wiring → UI Integration**
Last updated: 2026-05-08

## What

### Thread A: Environment + Deployment (user action required first)
Steps:
1. Fill out `.env` in project root with real values (see key source table below)
2. Create Railway project + Postgres addon, copy DATABASE_URL into .env
3. Set all env vars in Railway dashboard (match .env)
4. Run both DB migrations against Railway Postgres
5. Smoke test health endpoint on deployed URL

### Thread B: AI Wiring (Claude does this once .env is filled)
Steps:
1. Read existing agent endpoint code to understand current static response path
2. Build Gemini → OpenAI → Claude fallback service in backend
3. Replace static `example_output.json` response in all three agent endpoints (onboarding, professor, career-coach)
4. Pass existing system_instructions.md content as system prompt for each agent

### Thread C: UI Integration (Claude does this after Thread B)
Steps:
1. Wire `OnboardingFlow.jsx` into `App.jsx` — replace the raw JSON textarea for the onboarding step
2. Build proper form UI for professor_agent step (topic + comfort level — match OnboardingFlow token style)
3. Build proper form UI for career_coach_agent step (freetext "what feels stuck")
4. Replace raw JSON output `<pre>` blocks with human-readable result cards
5. Remove debug "API Base:" line (App.jsx line 132)

## Why
App is not usable by non-technical service industry workers (bartenders, servers, cashiers) in its current state. Raw JSON textarea and raw JSON output are developer tools. Real AI responses + proper forms + readable output are all required before any pilot user can use this.

## Scope
- Backend: AI fallback chain wired into all three agent endpoints
- Frontend: OnboardingFlow integrated, agent forms replace JSON textarea, output cards, debug line removed
- Deployment: Railway live with smoke tests passing

## Out of scope
- Interaction history UI
- Rate limiting on login codes
- Admin feedback view
- Phases 4–6

## Required reading before starting
- `.ai/handoff.md`
- `CLAUDE.md`
- `frontend/src/onboarding/OnboardingFlow.jsx` and `frontend/src/App.jsx` (understand the gap)
- `backend/src/modules/agents/phase2/` (understand agent contracts before wiring AI)

---

## .env Value Sources (quick reference)

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Railway dashboard → Postgres plugin → Connect tab |
| `ADAPTATION_DATABASE_URL` | Same as DATABASE_URL |
| `ADAPTATION_HOST` | `127.0.0.1` local / `0.0.0.0` on Railway |
| `FRONTEND_ORIGIN` | Railway frontend service → Settings → public domain |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | resend.com → Domains → verified sender address |
| `VITE_API_BASE_URL` | Railway backend service → Settings → public domain |

---

## Railway + Resend Verification Checklist

### Railway
- [ ] Create new project at railway.app
- [ ] Add Postgres plugin → copy DATABASE_URL
- [ ] Create backend service (root: `/backend`)
- [ ] Create frontend service (root: `/frontend`)
- [ ] Set all env vars in backend service Variables tab
- [ ] Set VITE_API_BASE_URL in frontend service Variables tab
- [ ] Run `npm run db:migrate:pilot:up` against Railway Postgres URL
- [ ] Run `npm run db:migrate:adaptation:up` against Railway Postgres URL
- [ ] Hit `GET <backend-url>/adaptation/health` → expect `{"status":"ok"}`
- [ ] Test auth flow: request code → receive email → verify → get session token

### Resend
- [ ] Log into resend.com → API Keys → create key → copy it
- [ ] Domains → verify your domain OR use onboarding@resend.dev for testing
- [ ] Set RESEND_API_KEY + RESEND_FROM_EMAIL in Railway env vars
- [ ] Send test email from Resend dashboard to confirm delivery
