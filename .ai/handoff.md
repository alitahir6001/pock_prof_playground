# Handoff — live state snapshot

## Last updated
2026-11-14 (deploy session, part 3: build-vs-test decision, vision v1.1, work order)

## Current state
The app is **live at `https://learn.pakfro.dev`** on Railway project `pocket-professor` (Postgres + backend + frontend, repo-linked, manual deploys only); server smoke checks pass, browser login/onboarding/`#admin` untested. **Decided 2026-11-14:** the n=3 test runs on `.ai/vision.md` build steps 1–4 (student file, professor memory, comeback check-in, email outreach), and **Claude writes the code for those steps**, with Ali reviewing (changes ADR-0022). `vision.md` is v1.1 with both decisions plus a "Beyond IT (someday)" section. ADR-0021, `.ai/pilot-test-design.md` and CLAUDE.md still describe the old plan.

## Active task
**Smoke the live app, then re-freeze the test docs, then plan and build steps 1–4.** Personal side project, no deadline. Each phase runs in its own chat: smoke feedback first, then re-freeze + plan + build.

Why steps 1–4 (advisor consult, 2026-11-14): a 0/3 on the thin app wouldn't be believed. Stopping after step 3 has the same gap, because a comeback check-in only reaches people who come back. Steps 5–6 mostly govern week 3+. Ali agreed that 1–4 is the smallest build where 0/3 counts as a real answer.

1. [ ] (user, then Claude) **Phone smoke** on `learn.pakfro.dev`:
   - login as `ali@pakfro.dev` (the code comes via the Porkbun forward to Gmail; check spam);
   - onboarding, plan, day 1, then reload;
   - `learn.pakfro.dev/#admin`.

   Ali reports the results in a feedback chat; Claude pulls `railway logs --service backend` for failures. Fixes are bugs and copy only. Do it first, because steps 1–4 build on login and onboarding.
2. [ ] (user) **AI spend caps** on OpenAI, Gemini and Anthropic, before step 4 ships or anyone else gets the URL.
3. [ ] (Claude drafts, Ali approves) **Re-freeze the docs before any code:**
   - a new ADR superseding or amending ADR-0021: the product under test is steps 1–4, quoting the four "done when" lines from vision v1.1 verbatim; same question, same ≥1/3 bar. Then put its number into vision's "Decided" note;
   - a new ADR amending ADR-0022: Claude writes steps 1–4 and Ali reviews; the rest of the ownership ladder stays;
   - `.ai/pilot-test-design.md`: automated app reminders are allowed and founder contact is still banned (`:28`, `:103`); reword mechanism evidence (`:74`, "the constraint"); add a day-0 check that each tester's first nudge lands in the inbox, not spam or Promotions;
   - check ADR-0018 (engine not wired) and ADR-0020 (event journal deferred), which steps 1 and 3 reverse;
   - CLAUDE.md "thesis under test" and "no new build" wording: **needs Ali's explicit OK**.
4. [ ] (Claude) **Plan all 4 steps** in plan mode: schema, migrations, routes, frontend, tests, how each "done when" gets verified, and AI cost per user-day. Step 4: daily trigger-time send on Railway (cron or worker), send logging, testing without spamming real addresses.
5. [ ] (Claude writes, Ali reviews) **Build steps 1→4 one at a time**: verify each against its "done when" line with real output, explain it in plain terms, and stop for review between steps.
   - Step 4 rule: at most one nudge a day, skipped if today's session is done, logged in the student file.
6. [ ] (user) **User zero**: run the real A+ track on prod during the build and skip days on purpose. This is a gate, not evidence. It yields tuned copy, catches breakage, and gives a measured AI cost per user-day.
7. [ ] (user) Name 2 more testers (1 identified). Create `.ai/pilot-log.md` at user 1's day 0.
8. [ ] (user) **Run the n=3** with prod frozen for 14 days; step 5 can continue on a branch.

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
- **Scope guard:** pre-test scope grew twice (thin → 1–3 → 1–4). Any further addition needs a new ADR naming the new evidence. The one foreseeable exception is SMS, if day-0 talks show email won't reach a tester (carrier registration lead time).
- **Ownership:** Claude writing steps 1–4 trades away the advisor's ownership guard; per-step plain-terms explanations are the mitigation.
- **Unanswered vision questions** (2026-09-14): shape of a professor session incl. learning checks; what ends a "course" (day 14 dead end); coach cadence; what the deterministic rules control.
- **Pending Ali's OK:** CLAUDE.md Architecture calls the adaptation engine "the critical path" (gotcha #18 says nothing calls it; step 3 will wire one rule).
- **Post-test pile:** WTP test, steps 5–6, progression ladder, prompt-injection hardening, behavioral research, multi-mode ("Beyond IT").

## Next recommended step
Ali runs the phone smoke on `learn.pakfro.dev` and reports results in a smoke-feedback chat.

## Out of scope
Steps 5–6, payments, exit report, recruiting/B2B, SMS/push (unless day-0 evidence), non-IT tracks; no prod deploys during the 14-day test.
