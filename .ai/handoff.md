# Handoff — live state snapshot

## Last updated
2026-11-15 (build session 2: vision step 4, the email nudge, built, verified locally, committed; ADR-0028; push and deploy requested by Ali)

## Current state
Vision steps 1–4 (student file, Professor memory, comeback check-in, daily email nudge) plus "keep going" are built and committed on `main`. Step 4 was verified locally with unit tests, a log-mode run and one real email to Ali. Prod (`https://learn.pakfro.dev`) runs this code as of `d7cda88`, with the nudge timer on in send mode; anyone who sets a reminder time gets real email.

## Active task
**Deploy steps 1–4, review them, then run the n=3 test.** Personal side project, no deadline. Claude writes, Ali reviews (ADR-0026). Commit and push only when asked.

1. [x] Docs re-frozen: ADR-0025 (test runs on steps 1–4), 0026, 0027, `.ai/pilot-test-design.md`.
2. [x] Steps 1–3: student file, Professor reads it, comeback (CLAUDE.md gotchas 19–20).
3. [x] Step 4, outreach (gotcha 21, ADR-0028). _Done when: at most one nudge a day arrives at the student's stated trigger time, is skipped if they've already done today's session, and is recorded in the student file._ Evidence: `test:phase3` 138/139 (26 nudge tests); local run over four timer ticks gave exactly one `nudge_sent` for a user with no session and one `nudge_skipped` for a user who had done today's; a failed send wrote `nudge_failed` with no retry; one real email reached Ali through `NUDGE_MODE=send` + `NUDGE_ALLOWLIST` while an unlisted user got a dry run; the stop route wrote `nudge_stopped` once across two presses.
4. [x] **Deployed 2026-11-15** at `d7cda88`: migrations 005 and 006 applied on prod first, then prod env `NUDGE_ENABLED=true` and `NUDGE_MODE=send` (no allowlist), then backend, then frontend. Checked: health ok, backend log "Nudge timer on" mode `send`, live bundle contains the new screens, `POST /pilot/nudge/stop` answers. Not checked on prod: a logged-in session, and a nudge actually going out (the one prod user has no reminder time yet).
5. [ ] (Ali, with Claude's help) **Browser review of steps 1–4.** Ali asked for help and paused before choosing how: he walks prod while Claude guides (comeback banner not visible until 2 missed days), or Claude runs a local throwaway stack and sends screenshots (needs Ali's OK; his default is no browser preview). Nothing built in steps 1–4 has been looked at in a browser: `recall_note` on the session screen, comeback banner (dashboard and session), "Keep going" link, the "Remind me around" field in the onboarding Trigger step, the dashboard reminder prompt, the stop page (`/#stop=<token>`). The stop link has not been clicked from a delivered email.
6. [ ] (Ali) **Edit the copy**, all Claude's drafts and frozen once the test starts: `nudgeEmail()` in `backend/src/modules/student/nudge.ts`; `comebackNote()` in `student/comeback.ts`; on-screen wording in `ReminderTimeField` (`Trigger.jsx`), `ReminderPrompt` and `StopNudges` (`App.jsx`). Also decide the Risk-step line that promises triggers "instead of clock times" (`frontend/src/onboarding/data.js:110`) right before a clock time is asked for.
7. [ ] (Ali) **AI spend caps** on OpenAI, Gemini, Anthropic before anyone else gets the URL.
8. [ ] (Ali) **User zero** on prod: real A+ track, skip days on purpose. Gate, not evidence; gives tuned copy and a measured AI cost per user-day.
9. [ ] (Ali) Name 2 more testers (1 identified). Create `.ai/pilot-log.md` at user 1's day 0. Day-0 inbox check: `scripts/send_sample_nudge.mjs <email>`.
10. [ ] (Ali) **Run the n=3**, prod frozen for 14 days.

**Verifying locally:** Ali's Postgres (EDB, `/Library/PostgreSQL/18`) needs sudo to start, so Claude runs a throwaway cluster: `initdb` into the scratchpad, start with `-o "-p 5433 -c unix_socket_directories=''"` (the scratchpad path is too long for a socket), apply all six migrations, backend on port 3041. `node scripts/dev_seed_student_file.mjs [comeback]` fakes a week of history (localhost DB only). No AI keys = free canned lessons. For nudge tests set the user's time zone BEFORE creating the plan. Ali's local `.env` now holds the Resend key and sender, so a local login sends a real email unless those are blanked.

**Live deploy reference**
- **Manual deploys.** `railway api 'mutation($s:String!,$e:String!,$c:String!){serviceInstanceDeployV2(serviceId:$s,environmentId:$e,commitSha:$c)}' --raw-var s=<serviceId> --raw-var e=<envId> --raw-var c=$(git rev-parse origin/main)` (IDs via `railway status --json`).
- Project `pocket-professor`, env `production`: `Postgres`, `backend` (root `/backend`, port 3040, `backend-production-f74fcea6.up.railway.app`), `frontend` (root `/frontend`, `PORT=8080`, `learn.pakfro.dev`).
- Backend env: `NODE_ENV=production`, `ADAPTATION_PERSISTENCE_MODE=postgres`, `ADAPTATION_HOST=0.0.0.0`, `ADAPTATION_PORT=3040`, both DB URLs = `${{Postgres.DATABASE_URL}}`, `FRONTEND_ORIGIN=https://learn.pakfro.dev`, `ADMIN_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, 3 AI keys, no model overrides. **Never** `PILOT_EXPOSE_DEV_CODE`. Frontend: `VITE_API_BASE_URL` (build-time).
- Migrations: `railway connect Postgres --tunnel-only --port <p>`, then `db:migrate:*` with `ADAPTATION_DATABASE_URL` at `127.0.0.1:<p>` (ADR-0024). zsh: write `${m}`, not `$m:up`.
- AI in prod (measured 2026-11-15): every call served by OpenAI. Professor = `gpt-5.4-mini-2026-03-17`, Onboarding = `gpt-5.5-2026-04-23`.
- DNS at Porkbun; Resend DKIM/SPF/DMARC verified. Domain change = update `FRONTEND_ORIGIN` (ADR-0023).

**Run locally:** backend `cd backend && npm run build:phase3 && npm run start:adaptation-runtime` (:3040); frontend `cd frontend && npm run dev` (:5173). Local `.env` has `PILOT_EXPOSE_DEV_CODE=true` and `FRONTEND_ORIGIN=http://localhost:5173`. Ali runs servers and browses himself.

## Open threads
- **Railway deadline 2026-12-01:** the CLI warns `railway.json` config stops working then (`railway config migrate`). Both services build from those files. Not done.
- **Stale test:** `agentInferenceRunner.test.ts:109` expects "EXACTLY 3" career options; the prompt has said "3 to 6" since eebb05a. The test is wrong, not the code; fixing it is Ali's call.
- **Scope guard:** pre-test scope grew three times. Anything more needs a new ADR naming new evidence. Ali's paused smoke-test notes (login/security fixes, UI tweaks) live in the "phone smoke test" chat and are parked in `.ai/backlog.md`; **remind Ali to go through that chat** before the test starts.
- **Nudge limits, accepted for the test:** if the backend is down for a student's whole hour, that day's nudge is lost; a stop cannot be undone from the app; where the email lands (inbox, Promotions, Spam) is unmeasured.
- **Post-test pile:** WTP test, vision steps 5–6, prompt-injection hardening, behavioral research, multi-mode. Step 2's memory was proven on two tidy live runs only; user zero is the real check.

## Next recommended step
Ali reviews steps 1–4 in a browser (on prod as user zero, or locally) and edits the copy.

## Out of scope
Vision steps 5–6, payments, exit report, recruiting/B2B, SMS/push (unless day-0 evidence), non-IT tracks; no prod deploys during the 14-day test.
