# Handoff — live state snapshot

## Last updated
2026-11-15 (build session 1: docs re-frozen, ADR-0025/0026/0027, vision steps 1–3 built)

## Current state
The app is **live at `https://learn.pakfro.dev`** (Railway, manual deploys) and still runs the pre-build code. Vision steps 1–3 (student file, Professor memory, comeback check-in) plus "keep going" (ADR-0027) are built, verified locally and pushed to `main`, but **not deployed**; prod and Ali's local DB lack migration 005. Step 4 (email nudge) is not started; its design is approved in `~/.claude/plans/mellow-pondering-acorn.md`, section "Step 4".

## Active task
**Build step 4, then deploy, then run the n=3 test.** Personal side project, no deadline. Claude writes, Ali reviews (ADR-0026). Per step: verify against the "done when" line with real output, explain in plain terms, stop for review. Commit only when asked.

1. [x] Re-freeze docs: ADR-0025 (test runs on steps 1–4), ADR-0026 (Claude writes them), ADR-0027 (keep going, max 3 sessions a day), `.ai/pilot-test-design.md`, CLAUDE.md thesis.
2. [x] Step 1, student file: `pilot_student_events`, `GET /pilot/admin/student-file?email=`.
3. [x] Step 2, Professor reads it: server adds `student_history`; output field `recall_note`. Verified with live calls.
4. [x] Step 3, comeback: 2+ missed days in a row → 25% shorter first session + fixed note; wires the one engine rule.
5. [ ] (Ali) **Review steps 1–3 in a browser:** `recall_note` on the session screen, comeback banner on dashboard and session screen, "Keep going" link after finishing a session. None of these were looked at in a browser. Edit the comeback note in `backend/src/modules/student/comeback.ts` `comebackNote()` (Claude's draft).
6. [ ] (Claude) **Step 4, outreach.** _Done when: at most one nudge a day arrives at the student's stated trigger time, is skipped if they've already done today's session, and is recorded in the student file._ From the approved plan:
   - migration 006: `pilot_users.reminder_time`, `nudges_stopped_at`;
   - "Remind me around" time field in the onboarding Trigger step, saved via `POST /pilot/me/settings`; one-time dashboard prompt for users who onboarded earlier;
   - pure `decideNudge` in `backend/src/modules/student/nudge.ts`; a once-a-minute timer inside the backend (`NUDGE_ENABLED`), not a Railway cron; insert `nudge_sent` first, send only if the insert succeeded (unique index = at most one a day); 60-minute catch-up window; `nudge_skipped` when done today; `nudge_failed`, no retry;
   - generic `sendEmail` refactored out of `sendLoginCodeEmail`; plain-text fixed copy (Claude drafts, Ali edits); stop link (`nudge_stopped`), flagged as Claude's addition, Ali can strike it;
   - no spam in testing: `NUDGE_MODE=log` default, `NUDGE_ALLOWLIST`, and `scripts/send_sample_nudge.mjs <email>` for the day-0 inbox check.
7. [ ] (user) **AI spend caps** on OpenAI, Gemini, Anthropic before step 4 ships or anyone else gets the URL.
8. [ ] (Claude, only when Ali says go) **Deploy:** migration 005 (and 006) on prod **before** the code, then backend, then frontend. See gotcha 19.
9. [ ] (user) **User zero** on prod: real A+ track, skip days on purpose. Gate, not evidence; gives tuned copy and a measured AI cost per user-day.
10. [ ] (user) Name 2 more testers (1 identified). Create `.ai/pilot-log.md` at user 1's day 0.
11. [ ] (user) **Run the n=3**, prod frozen for 14 days.

**Verifying locally (how this session did it):** Ali's local Postgres (EDB install, `/Library/PostgreSQL/18`) needs sudo to start, so Claude ran a throwaway cluster: `initdb` into the scratchpad, port 5433, all migrations, backend on port 3041. `node scripts/dev_seed_student_file.mjs [comeback]` fakes a week of history (localhost DB only). Running the backend with no AI keys gives free canned lessons.

**Live deploy reference**
- **Manual deploys.** `railway api 'mutation($s:String!,$e:String!,$c:String!){serviceInstanceDeployV2(serviceId:$s,environmentId:$e,commitSha:$c)}' --raw-var s=<serviceId> --raw-var e=<envId> --raw-var c=$(git rev-parse origin/main)` (IDs via `railway status --json`).
- Project `pocket-professor`, env `production`: `Postgres`, `backend` (root `/backend`, port 3040, `backend-production-f74fcea6.up.railway.app`), `frontend` (root `/frontend`, `PORT=8080`, `learn.pakfro.dev`).
- Backend env: `NODE_ENV=production`, `ADAPTATION_PERSISTENCE_MODE=postgres`, `ADAPTATION_HOST=0.0.0.0`, `ADAPTATION_PORT=3040`, both DB URLs = `${{Postgres.DATABASE_URL}}`, `FRONTEND_ORIGIN=https://learn.pakfro.dev`, `ADMIN_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, 3 AI keys, no model overrides. **Never** `PILOT_EXPOSE_DEV_CODE`. Frontend: `VITE_API_BASE_URL` (build-time).
- Migrations (4 applied on prod): `railway connect Postgres --tunnel-only --port <p>`, then `db:migrate:*` with `ADAPTATION_DATABASE_URL` at `127.0.0.1:<p>` (ADR-0024). zsh: write `${m}`, not `$m:up`.
- AI in prod (measured from logs 2026-11-15): every call served by OpenAI. Professor = `gpt-5.4-mini-2026-03-17`, Onboarding = `gpt-5.5-2026-04-23`. Gemini and Anthropic are fallbacks only.
- DNS at Porkbun; Resend DKIM/SPF/DMARC verified. Domain change = update `FRONTEND_ORIGIN` (ADR-0023).

**Run locally:** backend `cd backend && npm run build:phase3 && npm run start:adaptation-runtime` (:3040); frontend `cd frontend && npm run dev` (:5173). Local `.env` has `PILOT_EXPOSE_DEV_CODE=true`. Ali runs servers and browses himself.

## Open threads
- **Railway deadline 2026-12-01:** the CLI warns `railway.json` config stops working then (`railway config migrate`). Both services build from those files. Not done.
- **Stale test:** `agentInferenceRunner.test.ts:109` expects "EXACTLY 3" career options; the prompt has said "3 to 6" since eebb05a. `test:phase3` is 112/113 because of it. The test is wrong, not the code; fixing it is Ali's call.
- **Scope guard:** pre-test scope grew three times (thin → 1–3 → 1–4 → keep going). Anything more needs a new ADR naming new evidence. Ali has parallel UI-feedback and security-pass work paused in the "phone smoke test" chat; it touches `App.jsx` and the route file, so merge it after step 4.
- **Step 2 caveat:** proven on two live runs with tidy seed data; the model is not deterministic. User zero is the real check. AI spend this session: 3 Professor calls, about 1.5 cents (estimated).
- **Post-test pile:** WTP test, vision steps 5–6, prompt-injection hardening, behavioral research, multi-mode. Also pending Ali's OK: CLAUDE.md still calls the engine "the critical path".

## Next recommended step
Ali reviews steps 1–3 in a browser; then Claude builds step 4 from the approved plan in a fresh chat.

## Out of scope
Vision steps 5–6, payments, exit report, recruiting/B2B, SMS/push (unless day-0 evidence), non-IT tracks; no prod deploys during the 14-day test.
