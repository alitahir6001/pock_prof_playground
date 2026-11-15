# Handoff — live state snapshot

## Last updated
2026-11-14 (deploy session, part 2: build-vs-test decision)

## Current state
The app is **live at `https://learn.pakfro.dev`** on Railway project `pocket-professor` (Postgres + backend + frontend, repo-linked, manual deploys only); server smoke checks pass, browser login/onboarding/`#admin` untested. **Decided 2026-11-14:** the n=3 test runs on `.ai/vision.md` build steps 1–4 (student file, professor memory, comeback check-in, outreach), not the thin version and not the full vision. Nothing for that decision is written into the frozen docs yet: ADR-0021, `.ai/pilot-test-design.md`, `vision.md`'s A/B section and CLAUDE.md still describe the old plan.

## Active task
**Re-freeze the test around steps 1–4, then build steps 1→4.** Ali types the code; Claude explains and reviews (ADR-0022). Personal side project, no deadline.

Why (advisor consult, 2026-11-14): a 0/3 on the thin app wouldn't be believed. Stopping after step 3 has the same gap, because a comeback check-in only reaches people who come back, and the likely failure in a founder-silent test is quiet drop-off. Steps 5–6 mostly govern week 3+, so they add little to a 14-day test. Ali agreed that steps 1–4 is the smallest build where 0/3 counts as a real answer.

1. [ ] (Claude drafts, Ali approves) **Re-freeze docs before any code:**
   - a new ADR superseding or amending ADR-0021: product under test = steps 1–4 at their "done when" lines; same question, same ≥1/3 bar;
   - edit `.ai/pilot-test-design.md`: automated app reminders are allowed, and founder contact is still banned (`:28`, `:103`). Reword the mechanism-evidence line (`:74`, "the constraint"), since a return can now be caused by outreach;
   - edit `vision.md`'s "Open decision" section to mark it resolved;
   - update ADR-0018 (engine not wired) and ADR-0020 (event journal deferred) where step 1/3 reverses them;
   - CLAUDE.md "thesis under test" and "no new build" wording: **needs Ali's explicit OK**.
2. [ ] (Ali types) Step 1, student file: per-user append-only event log (sessions, answers, misses, check-ins). Done when every session and miss for a user reads back in order from one place. This is also the test's measuring instrument.
3. [ ] (Ali types) Step 2, professor reads it. Done when a lesson references something from 3+ days ago unprompted.
4. [ ] (Ali types) Step 3, comeback check-in (wire the missed-session rule). Done when returning after 2+ missed days gets a shorter session plus a no-guilt acknowledgement.
5. [ ] (Ali types) Step 4, outreach, **email only via Resend** (SMS/push later). Done when a nudge arrives at the stated trigger time and stops once today's session is done.
6. [ ] (user) Founder as user zero, as a gate and not as evidence: run the real A+ track on prod during the build and skip days on purpose. Gives tuned copy, catches breakage, and a measured AI cost per user-day.
7. [ ] (user) Still pending: phone smoke on `learn.pakfro.dev`; AI spend caps on all 3 providers **before** anyone else gets the URL; name 2 more testers (1 identified); create `.ai/pilot-log.md` at user 1's day 0.
8. [ ] (user) Run the n=3 with prod **frozen for 14 days**; step 5 can continue on a branch.

**Live deploy reference**
- **Deploys are manual** (2026-11-14): GitHub push triggers deleted on both services, so pushes never touch the live app. To ship: `railway api 'mutation($s:String!,$e:String!,$c:String!){serviceInstanceDeployV2(serviceId:$s,environmentId:$e,commitSha:$c)}' --raw-var s=<serviceId> --raw-var e=<envId> --raw-var c=$(git rev-parse origin/main)` (IDs via `railway status --json`). Tested on both services.
- Railway project `pocket-professor`, env `production`. Services: `Postgres`, `backend` (root `/backend`, port 3040, domain `backend-production-f74fcea6.up.railway.app`), `frontend` (root `/frontend`, `PORT=8080`, custom domain `learn.pakfro.dev`; the generated `frontend-production-9f4b149b.up.railway.app` loads but can't log in). Old project deleted; Railway finalizes 2026-11-16.
- Build: Nixpacks via `<service>/railway.json` (build log confirms; ADR-0011 holds).
- Backend env: `NODE_ENV=production`, `ADAPTATION_PERSISTENCE_MODE=postgres`, `ADAPTATION_HOST=0.0.0.0`, `ADAPTATION_PORT=3040`, `DATABASE_URL` + `ADAPTATION_DATABASE_URL` = `${{Postgres.DATABASE_URL}}`, `FRONTEND_ORIGIN=https://learn.pakfro.dev`, `ADMIN_EMAIL`, `RESEND_API_KEY` (send-only, `pakfro.dev`), `RESEND_FROM_EMAIL`, 3 AI keys. `ADAPTATION_INTERNAL_TOKEN` unset (evaluate disabled). **Never** `PILOT_EXPOSE_DEV_CODE` (#14). Frontend: `VITE_API_BASE_URL` (build-time), `NODE_ENV`, `PORT`.
- DNS at Porkbun: Resend DKIM/SPF/DMARC (verified); `learn` CNAME + `_railway-verify.learn` TXT. Domain change = update `FRONTEND_ORIGIN` (ADR-0023).
- Migrations (4 applied): `railway connect Postgres --tunnel-only --port <p>`, then `db:migrate:*` with `ADAPTATION_DATABASE_URL` at `127.0.0.1:<p>`. No public TCP proxy (ADR-0024). zsh: write `${m}`, not `$m:up`.
- Model IDs: openai fast `gpt-5.4-mini-2026-03-17` / mid `gpt-5.4-2026-03-05` / deep `gpt-5.5-2026-04-23`; gemini fast+mid `gemini-3.5-flash`, deep `gemini-3.1-pro-preview`; anthropic fast `claude-haiku-4-5-20251001`, mid `claude-sonnet-4-6`, deep `claude-opus-4-8`.

**Run locally:** backend `cd backend && npm run build:phase3 && npm run start:adaptation-runtime` (:3040); frontend `cd frontend && npm run dev` (:5173). Local PG18, all 4 migrations; `.env` has `PILOT_EXPOSE_DEV_CODE=true`. Ali runs servers and browses himself.

## Open threads
- **Scope guard:** pre-test scope grew twice (thin → 1–3 → 1–4). Any further addition needs a new ADR naming the new evidence. The one legitimate exception is SMS, if day-0 talks show email won't reach a tester; it needs carrier registration lead time.
- **Unanswered vision questions** (2026-09-14): shape of a professor session incl. learning checks; what ends a "course" (day 14 dead end); coach cadence; what the deterministic rules control. Ideas: a bounded live tutor; an exit question on drop-off.
- **Pending Ali's OK:** CLAUDE.md Architecture calls the adaptation engine "the critical path" (gotcha #18 says nothing calls it; step 3 will wire one rule).
- **Post-test pile:** WTP test, progression ladder, prompt-injection hardening, behavioral research, multi-mode, steps 5–6.

## Next recommended step
New session: draft the re-freeze (new ADR + `pilot-test-design.md` edits) for Ali's approval, then plan step 1's schema with Ali typing.

## Out of scope
Steps 5–6, payments, exit report, recruiting/B2B, Phases 5–6, SMS/push (unless day-0 evidence), cold B2B; no prod deploys during the 14-day test.
