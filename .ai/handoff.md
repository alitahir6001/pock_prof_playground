# Handoff — live state snapshot

## Last updated
2026-11-20 (copy session: copy edited, pushed and deployed to prod)

## Current state
Vision steps 1–4 plus "keep going" are live on prod (`https://learn.pakfro.dev`), nudge timer on in send mode. Backend is at `a459994`, frontend at `df74015` (the last commit was backend-only). Since the walk fixes (`7729a2f`) the deployed changes are the copy edits: Log out as a button, the nudge email rewritten and sent as HTML (`EmailMessage.html`, plain-text part kept; subject "Hey, this is The Professor"), the comeback note, the reminder helper and prompt, the after-session, risk-step and not-on-list lines, and em dashes removed from all user-facing frontend copy. `test:phase3` is 150/151, the one failure being the known stale test. Signup is closed: `PILOT_ALLOWED_EMAILS` holds Ali's personal address only, and `ADMIN_EMAIL` is always allowed.

## Active task
**Close the open items, then run the n=3 test.** Personal side project, no deadline. Claude writes, Ali reviews (ADR-0026). Commit and push only when asked.

1. [x] Steps 1–4 built and deployed (gotchas 19–21, ADR-0025 to 0028).
2. [x] Code review, local browser review, pre-test fixes and security pass, 2026-11-16 (gotchas 22–23).
3. [x] **Prod walk, 2026-11-16.** Login code in inbox. Nudge set 23:01, arrived 23:02 in inbox, `nudge_sent` with `dry_run: false`. Stop link pressed on `alitahir6001@gmail.com`, `nudge_stopped` recorded; that account gets no more nudges. Recall note seen on `ali@pakfro.dev` day 2. Student file read as admin. Not seen on prod: comeback banner (needs 2 missed days in a row).
4. [x] **Walk fixes, deployed 2026-11-17 at `7729a2f`:** Enter submits login; stop page says "Reminders are off" after a reload (`POST /pilot/nudge/status`, reads only); "Log out" on the dashboard and in the onboarding header (`POST /pilot/auth/logout` deletes that one session; logout also clears the onboarding draft, which is per browser, not per account); comeback dashboard gives the minutes once; header shows the day just finished; divider sets "Keep going" apart; canned lesson on a comeback day uses the comeback minutes (`fitLessonToMinutes` in `student/comeback.ts`, tested). Checked locally in a browser and on prod by route probes and the live bundle.
5. [x] **New screens checked on prod, 2026-11-20:** Enter on login and Log out in both places work. The stop link was not re-checked from the real email (Ali deleted it); skipped by choice. Route and local checks stand.
6. [x] **Copy edited and deployed, 2026-11-20**. Sentence case throughout, no em dashes in user-facing frontend copy. The nudge email and the comeback note are Ali's wording (links and HTML added by Claude); Claude drafted the rest at Ali's request: the reminder helper, the dashboard reminder prompt, the after-session message, the risk-step line, the not-on-list error and the em-dash swaps. Unchanged on purpose: StopNudges, the login body, the retry screen, the feedback strings, "Log out" wording, "Too many codes requested. Try again later." Still has em dashes: the "—" empty-value placeholders in the admin table, the "— P" coach-note signature, and the Professor's live lesson text (a prompt-wording change). `scripts/send_sample_nudge.mjs <email>` sends a real sample (set `FRONTEND_ORIGIN=https://learn.pakfro.dev` or the link points at localhost).
6b. [x] **Copy deployed, 2026-11-20:** backend `a459994`, frontend `df74015`, health ok, new copy seen on prod (allowlist error, reminder prompt, Log out pill in the live bundle). A sample nudge to `alitahir6001@gmail.com` arrived and the HTML looked right (Ali's check). The subject change to "The Professor" was deployed after that sample and has not been seen in an inbox.
7. [ ] (Ali) **AI spend caps** on OpenAI, Gemini, Anthropic.
8. [ ] (Ali) **User zero** is `ali@pakfro.dev`. It is on a Commercial Pilot track, not the A+ track the test uses, and has no reminder time (fill in the dashboard box). Real A+ track, skip days on purpose. Gate, not evidence; gives tuned copy and a measured AI cost per user-day.
9. [ ] (Ali) Name 2 more testers (1 identified). **Add each tester's email to `PILOT_ALLOWED_EMAILS` at their day 0 or they cannot log in** (comma-separated; changing it restarts the backend). Create `.ai/pilot-log.md` at user 1's day 0. Day-0 inbox check: `scripts/send_sample_nudge.mjs <email>`.
10. [ ] (Ali) Bring over any remaining "phone smoke test" notes before the test starts.
11. [ ] (Ali) **Run the n=3**, prod frozen for 14 days.

**Decided this session:** the recall note stays inline, not a modal (it is the visible sign the app remembers, which is under test). The reminder box stays on the dashboard under the start button; only accounts with no reminder time see it.

**Verifying locally:** Ali's Postgres (EDB, `/Library/PostgreSQL/18`) needs sudo, so use a throwaway cluster: `initdb` into the scratchpad, start with `-o "-p 5433 -c unix_socket_directories='' -c listen_addresses=127.0.0.1"`, apply all six migrations, run the backend with `env -i` and explicit vars (no Resend or AI keys = no email, free canned lessons, `PILOT_EXPOSE_DEV_CODE=true` shows the code). `frontend/.env.local` points at `localhost:3040`, so run the test backend on 3040. Comeback without waiting: onboard a user, then shift `pilot_student_events.local_date` and `occurred_at` back 3 days. The canned lesson has no `recall_note`. Ali's `.env` holds the real Resend key, so a login through `start:adaptation-runtime` sends real email.

**Live deploy reference**
- **Manual deploys.** `railway api 'mutation($s:String!,$e:String!,$c:String!){serviceInstanceDeployV2(serviceId:$s,environmentId:$e,commitSha:$c)}' --raw-var s=<serviceId> --raw-var e=<envId> --raw-var c=$(git rev-parse origin/main)` (IDs via `railway status --json`). Poll with `query($id:String!){deployment(id:$id){status}}`; each took under a minute on 2026-11-17. Backend before frontend when the frontend calls new routes. Use the Railway CLI; the plugin's connector is not authorized.
- Project `pocket-professor`, env `production`: `Postgres`, `backend` (root `/backend`, port 3040, `backend-production-f74fcea6.up.railway.app`), `frontend` (root `/frontend`, `PORT=8080`, `learn.pakfro.dev`).
- Backend env: `NODE_ENV=production`, `ADAPTATION_PERSISTENCE_MODE=postgres`, `ADAPTATION_HOST=0.0.0.0`, `ADAPTATION_PORT=3040`, both DB URLs = `${{Postgres.DATABASE_URL}}`, `FRONTEND_ORIGIN=https://learn.pakfro.dev`, `ADMIN_EMAIL`, `PILOT_ALLOWED_EMAILS`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NUDGE_ENABLED=true`, `NUDGE_MODE=send`, 3 AI keys, no model overrides. **Never** `PILOT_EXPOSE_DEV_CODE`. Frontend: `VITE_API_BASE_URL` (build-time).
- Migrations: `railway connect Postgres --tunnel-only --port <p>`, then `db:migrate:*` with `ADAPTATION_DATABASE_URL` at `127.0.0.1:<p>` (ADR-0024). Migration before code.
- AI in prod (measured 2026-11-15): every call served by OpenAI. Professor = `gpt-5.4-mini-2026-03-17`, Onboarding = `gpt-5.5-2026-04-23`.
- DNS at Porkbun; Resend DKIM/SPF/DMARC verified. A domain change means updating `FRONTEND_ORIGIN` (ADR-0023) and the `connect-src` entry in `frontend/public/serve.json`.

## Open threads
- **Railway deadline 2026-12-01:** the CLI warns `railway.json` config stops working then (`railway config migrate`). Both services build from those files. Not done.
- **Stale test:** `agentInferenceRunner.test.ts:109` expects "EXACTLY 3" career options; the prompt has said "3 to 6" since eebb05a. The test is wrong, not the code; fixing it is Ali's call.
- **Scope guard:** anything beyond a fix needs a new ADR naming new evidence. Rejected for now: a per-user daily AI call cap and a 16 KB input limit (the allowlist and provider spend caps cover it).
- **Security, accepted or unmeasured:** the lockout and throttle were measured locally only, not under load on prod; someone who knows a tester's address can burn that tester's 20 codes a day; the admin student-file route logs the tester's email in the URL; sessions last 30 days unless the user logs out; 2 frontend advisories remain that only affect the Vite dev server.
- **Nudge limits, accepted for the test:** a backend outage for a student's whole hour loses that day's nudge; a stop cannot be undone from the app (undo = SQL on `pilot_users.nudges_stopped_at`); a dropout is emailed daily until they press Stop. **Post-test pile:** WTP test, vision steps 5–6, prompt-injection hardening, behavioral research, multi-mode.

## Watch during the test (not a fix, needs evidence first)
The email's "Open it here" goes to the site root. A tester without a saved session (a mail app's in-app browser, a new device, 30 days gone) signs in by email, code and verify, then lands on the dashboard, not the lesson. That is friction for a tired tester. A deep link or a magic-link sign-in would each need an ADR naming new evidence; record how often testers stall at login before proposing either. A deep link must not start the session itself (that triggers an AI call and counts a session).

## Next recommended step
Work through the open items (7 to 10) before day 0: AI spend caps, user zero's reminder time, two more testers (and their allowlist entries at day 0), phone smoke-test notes.

## Out of scope
Vision steps 5–6, payments, exit report, recruiting/B2B, SMS/push (unless day-0 evidence), non-IT tracks; no prod deploys during the 14-day test.
