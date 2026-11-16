# Handoff — live state snapshot

## Last updated
2026-11-16 (review session: code review of steps 1–4, local browser review with screenshots, five fixes plus two UI changes written, verified locally, committed, pushed and deployed to prod at `2541d21`; `PILOT_ALLOWED_EMAILS` set)

## Current state
Vision steps 1–4 (student file, Professor memory, comeback check-in, daily email nudge) plus "keep going" are built and committed on `main`. Step 4 was verified locally with unit tests, a log-mode run and one real email to Ali. Prod (`https://learn.pakfro.dev`) runs `2541d21` (backend and frontend, deployed 2026-11-16, no migration), with the nudge timer on in send mode; anyone who sets a reminder time gets real email.

**Committed on `main` 2026-11-16 (`990d5e9` onward), pushed and deployed 2026-11-16: five fixes, one commit each, plus two UI changes from Ali's smoke-test notes (login wording "Sign in or get started.", a "Send feedback" link on the dashboard)** (CLAUDE.md gotcha 22):
1. Failed plan load no longer shows onboarding (which wiped completed days): 401 goes to login, anything else shows a retry screen. `frontend/src/App.jsx`.
2. "Adjust my answers" and "Redo my plan" are hidden once a day is done (both wiped completed days). `App.jsx`.
3. Email allowlist `PILOT_ALLOWED_EMAILS`: `backend/src/modules/pilot/emailAllowlist.ts` + test, wired in `run_adaptation_fastify.mjs`, registered in `tsconfig.json` and `package.json`. **Set on prod 2026-11-16 to Ali's personal address only (`ADMIN_EMAIL` is always allowed). Add each tester's email to it at their day 0 or they cannot log in; changing it restarts the backend.**
4. No nudge on the day a plan starts if it started after that day's reminder time. `student/nudge.ts` + 2 tests.
5. Feedback: thumb tap saves the rating, then an optional comment with Send (a typed comment used to be lost). `App.jsx`.

**Committed on `main` (2026-11-16, later), not deployed: a security pass, four fixes, one commit each** (CLAUDE.md gotcha 23): exact login lockout; per-email throttle on code requests; browser security headers via `frontend/public/serve.json`; non-breaking dependency patches (backend `fastify` 5.12.8, frontend `serve` 14.2.8; backend audit now 0, frontend has 2 left that only affect the Vite dev server). `test:phase3` 147/148 (same stale test). Measured locally: 100 parallel wrong codes, never more than 8 judged; 12 parallel code requests, exactly 5 sent; a code cannot be used twice. Not yet deployed; after deploy, check on prod that the login page loads with fonts and that a code request reaches the backend (that proves the `connect-src` entry).

Evidence: `test:phase3` 144/145 (only the known stale test fails). Checked in a local browser: 1, 2, 5. Checked over HTTP: 3 (stranger 403 and no code row; unlisted old session 401). Checked on prod after deploy: health ok, "Nudge timer on" mode `send`, live bundle has the new login wording, feedback link and retry screen, and an unlisted email gets "This email isn't on the pilot list." Not checked on prod: a logged-in session. Fix 4 is covered by unit tests only. `frontend` `npm run build` passes.

## Active task
**Deploy steps 1–4, review them, then run the n=3 test.** Personal side project, no deadline. Claude writes, Ali reviews (ADR-0026). Commit and push only when asked.

1. [x] Docs re-frozen: ADR-0025 (test runs on steps 1–4), 0026, 0027, `.ai/pilot-test-design.md`.
2. [x] Steps 1–3: student file, Professor reads it, comeback (CLAUDE.md gotchas 19–20).
3. [x] Step 4, outreach (gotcha 21, ADR-0028). _Done when: at most one nudge a day arrives at the student's stated trigger time, is skipped if they've already done today's session, and is recorded in the student file._ Evidence: `test:phase3` 138/139 (26 nudge tests); local run over four timer ticks gave exactly one `nudge_sent` for a user with no session and one `nudge_skipped` for a user who had done today's; a failed send wrote `nudge_failed` with no retry; one real email reached Ali through `NUDGE_MODE=send` + `NUDGE_ALLOWLIST` while an unlisted user got a dry run; the stop route wrote `nudge_stopped` once across two presses.
4. [x] **Deployed 2026-11-15** at `d7cda88`: migrations 005 and 006 applied on prod first, then prod env `NUDGE_ENABLED=true` and `NUDGE_MODE=send` (no allowlist), then backend, then frontend. Checked: health ok, backend log "Nudge timer on" mode `send`, live bundle contains the new screens, `POST /pilot/nudge/stop` answers. Not checked on prod: a logged-in session, and a nudge actually going out (the one prod user has no reminder time yet).
5. [ ] (Ali, with Claude's help) **Browser review of steps 1–4.** Done locally 2026-11-16 with screenshots (canned lessons, no email): Trigger "Remind me around" field, dashboard reminder prompt, "Keep going" link, comeback banner on dashboard and session, stop page before and after. **Still to do on prod, any model can guide it:** (a) done 2026-11-16; (b) set a reminder time 5–10 minutes ahead and confirm the email arrives; (c) click the stop link from that email (a stop cannot be undone from the app, so use a throwaway account to press the button); (d) see a `recall_note` on a session after day 1 (it is null when the Professor finds no relevant earlier entry); (e) read the student file: logged in as `ADMIN_EMAIL`, `GET /pilot/admin/student-file?email=` with the session token from localStorage `pilot_session_token`, look for `nudge_sent` without `dry_run`.
   UI notes from the screenshots, Ali's to judge: comeback dashboard says "about 15 minutes" twice; header reads "Day 2 of 14" right after finishing day 1; "Come back tomorrow" sits directly above "Keep going"; if every AI provider fails on a comeback day the canned lesson says 20 minutes under a 15-minute banner.
6. [ ] (Ali) **Edit the copy**, all Claude's drafts and frozen once the test starts: `nudgeEmail()` in `backend/src/modules/student/nudge.ts`; `comebackNote()` in `student/comeback.ts`; on-screen wording in `ReminderTimeField` (`Trigger.jsx`), `ReminderPrompt` and `StopNudges` (`App.jsx`). New wording added 2026-11-16, also Claude's drafts: the retry screen ("Couldn't load your sprint."), the feedback comment step ("Thanks. Anything to add?"), the allowlist refusal ("This email isn't on the pilot list." in `run_adaptation_fastify.mjs`), the login body line under the new headline, and the dashboard feedback prompt ("How is Pocket Professor working for you?"). Also decide the Risk-step line that promises triggers "instead of clock times" (`frontend/src/onboarding/data.js:110`) right before a clock time is asked for.
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
- **Scope guard:** pre-test scope grew three times. Anything more needs a new ADR naming new evidence. Ali's first chunk of smoke-test notes was brought over and handled 2026-11-16 (security, returning-user login, feedback box, keep going). He said more notes exist in the "phone smoke test" chat; **remind Ali to bring the rest over** before the test starts. Rejected for now from that chat's reply: a per-user daily AI call cap and a 16 KB input limit (not needed once the allowlist is set and provider spend caps exist).
- **Dev-only oddity, unverified:** onboarding draft resume did not work under `npm run dev` (suspected React StrictMode double effect in `useOnboardingDraft.js`). Not checked on a production build.
- **Nudge limits, accepted for the test:** if the backend is down for a student's whole hour, that day's nudge is lost; a stop cannot be undone from the app; where the email lands (inbox, Promotions, Spam) is unmeasured.
- **Post-test pile:** WTP test, vision steps 5–6, prompt-injection hardening, behavioral research, multi-mode. Step 2's memory was proven on two tidy live runs only; user zero is the real check.

## Next recommended step
Ali logs in on prod and does the prod checks in Active task item 5 and the copy edit.

## Out of scope
Vision steps 5–6, payments, exit report, recruiting/B2B, SMS/push (unless day-0 evidence), non-IT tracks; no prod deploys during the 14-day test.
