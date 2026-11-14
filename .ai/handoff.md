# Handoff — live state snapshot

## Last updated
2026-11-14 (deploy session; follows the 2026-11-03 ADR backfill)

## Current state
The app is **live at `https://learn.pakfro.dev`** on a new Railway project `pocket-professor` (Postgres + backend + frontend, repo-linked, manual deploys only). Server-side smoke checks pass (health with DB + AI configured, CORS locked to `learn.pakfro.dev`, `/adaptation/evaluate` 403, admin 401 without a session), but a real browser login, onboarding and `#admin` are not yet tested. Vision lives in `.ai/vision.md`; decisions in `docs/adr/` (ADR-0001 to 0024; 0023 = the domain, 0024 = DB access only via SSH tunnel).

## Active task
**Shake down the live app, then run the n=3 founder-silent test.** Ali drives; Claude explains and reviews (ADR-0022). Personal side project, no deadline.

1. [ ] (user) Browser smoke on a phone: login as `ali@pakfro.dev` (code arrives via Porkbun forward to Gmail; check spam) → onboarding → plan → day 1 → reload → `learn.pakfro.dev/#admin`.
2. [ ] (user) AI spend caps on OpenAI, Gemini, Anthropic **before** anyone else gets the URL.
3. [ ] (user) Self-pilot 2–3 days on a real phone, including a skipped day (comeback path).
4. [ ] (user typing, Claude reviewing) Ownership ladder: onboarding copy → professor `soul.md` tone → delete dead `/pilot/onboarding/draft` call (gotcha #6) → add admin cohort column → change sprint length off 14.
5. [ ] (user) Name 2 more people (1 identified). Create `.ai/pilot-log.md` at user 1's day 0.
6. [ ] (user) Run the test per `.ai/pilot-test-design.md` (frozen once user 1 starts); score against its branch criteria the week it ends.

**Live deploy reference**
- **Deploys are manual** (2026-11-14): GitHub push triggers deleted on both services, repo still linked, so pushes never touch the live app. To ship a commit: `railway api 'mutation($s:String!,$e:String!,$c:String!){serviceInstanceDeployV2(serviceId:$s,environmentId:$e,commitSha:$c)}' --raw-var s=<serviceId> --raw-var e=<envId> --raw-var c=$(git rev-parse origin/main)` (IDs via `railway status --json`). Tested on frontend.
- Railway project `pocket-professor`, env `production`. Services: `Postgres`, `backend` (root `/backend`, port 3040, domain `backend-production-f74fcea6.up.railway.app`), `frontend` (root `/frontend`, `PORT=8080`, custom domain `learn.pakfro.dev` + generated `frontend-production-9f4b149b.up.railway.app`, which loads but can't log in). The old `pocket-professor-backend` project was deleted; Railway finalizes 2026-11-16.
- Build: Nixpacks via `<service>/railway.json` (build log confirms; ADR-0011 holds). Root dir and build/start commands are also set on each service with the same values.
- Backend env: `NODE_ENV=production`, `ADAPTATION_PERSISTENCE_MODE=postgres`, `ADAPTATION_HOST=0.0.0.0`, `ADAPTATION_PORT=3040`, `DATABASE_URL` + `ADAPTATION_DATABASE_URL` = `${{Postgres.DATABASE_URL}}`, `FRONTEND_ORIGIN=https://learn.pakfro.dev` (single origin), `ADMIN_EMAIL`, `RESEND_API_KEY` (send-only, `pakfro.dev` only), `RESEND_FROM_EMAIL`, 3 AI keys. `ADAPTATION_INTERNAL_TOKEN` unset, so evaluate stays disabled. **Never** `PILOT_EXPOSE_DEV_CODE` (#14). Frontend env: `VITE_API_BASE_URL` = backend URL (build-time), `NODE_ENV`, `PORT`.
- DNS at Porkbun: Resend DKIM/SPF/DMARC records (verified); `learn` CNAME + `_railway-verify.learn` TXT. Changing the domain means updating `FRONTEND_ORIGIN` (ADR-0023).
- Migrations (all 4 applied 2026-11-14): `railway connect Postgres --tunnel-only --port <p>` (SSH key registered with Railway), then run `db:migrate:*` with `ADAPTATION_DATABASE_URL` pointed at `127.0.0.1:<p>`. No public TCP proxy (ADR-0024). In zsh, write `${m}` not `$m:up` (`:u` is an uppercase modifier).
- Verified model IDs (env-overridable): openai fast `gpt-5.4-mini-2026-03-17` / mid `gpt-5.4-2026-03-05` / deep `gpt-5.5-2026-04-23`; gemini fast+mid `gemini-3.5-flash`, deep `gemini-3.1-pro-preview`; anthropic fast `claude-haiku-4-5-20251001`, mid `claude-sonnet-4-6`, deep `claude-opus-4-8`.

**Run locally:** backend `cd backend && npm run build:phase3 && npm run start:adaptation-runtime` (:3040); frontend `cd frontend && npm run dev` (:5173). Local PG18 with all 4 migrations; `.env` has `PILOT_EXPOSE_DEV_CODE=true`. Ali runs servers and browses himself; no preview tool unless asked.

## Open threads
- **A/B decision (`.ai/vision.md`):** test the current thin version (A), or first build the minimal slice of student file + professor memory + comeback check-in (B, Claude's lean). Changing the test means editing `pilot-test-design.md` before user 1 starts.
- **Unanswered vision questions** (2026-09-14 session): shape of a professor session incl. learning checks; what ends a "course" (day 14 is a dead end); coach cadence and scope; who catches a dropout; what the deterministic rules control; which phase of Ali's story the product is. Ideas: a *bounded* live tutor scoped to today's task; an exit question on drop-off.
- **Pending Ali's OK:** CLAUDE.md Architecture still calls the adaptation engine "the critical path"; gotcha #18 shows nothing calls it.
- **Post-test pile (gated on a result):** WTP test, engine wiring, progression ladder, prompt-injection hardening, behavioral research, multi-mode.

## Next recommended step
Ali does the phone login/onboarding/`#admin` check on `learn.pakfro.dev`; Claude pulls backend logs (`railway logs --service backend`) for any step that fails.

## Out of scope
Until the test produces a result: no payments, exit report, engine wiring, event-journal re-architecture, Phases 4–6, recruiting/B2B; self-pilot fixes are bugs and copy only (unless Ali picks option B).
