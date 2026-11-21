# Handoff — live state snapshot

## Last updated
2026-11-20 (copy, deploy and test-fix session)

## Current state
Vision steps 1–4 plus "keep going" are live on prod (`https://learn.pakfro.dev`): backend `a459994`, frontend `df74015`, nudge timer on in send mode. This session's copy edits (sentence case, no em dashes in user-facing frontend copy, the nudge email sent as HTML with subject "Hey, this is The Professor", the comeback note, reminder and risk-step lines) are deployed; `test:phase3` is 151/151 after the stale assertion fix (`4a521fc`). Signup is closed: `PILOT_ALLOWED_EMAILS` holds Ali's personal address only, and `ADMIN_EMAIL` is always allowed.

## Active task
**Close the open items, then run the n=3 test.** Personal side project, no deadline. Claude writes, Ali reviews (ADR-0026). Commit and push only when asked; stage files by name (an untracked `.railway/` must not be swept in).

1. [x] Built and deployed: steps 1–4 (gotchas 19–21, ADR-0025 to 0028), review and security pass (gotchas 22–23), prod walk 2026-11-16, walk fixes at `7729a2f` (gotcha 24).
2. [x] 2026-11-20: Enter on login and Log out (dashboard, onboarding) checked by Ali on prod; the stop link was not re-checked from the real email (deleted; skipped by choice). Copy edited and deployed: nudge email and comeback note are Ali's wording (links and HTML added by Claude), the rest drafted by Claude at Ali's request. Ali saw the HTML sample arrive and look right; the later "The Professor" subject change has not been seen in an inbox.
3. [x] AI spend caps set by Ali (from another project). Confirm once they cover the keys prod uses; caps can be per project or per key.
4. [ ] (Ali) **User zero** is `ali@pakfro.dev`: Commercial Pilot track, not the A+ track the test uses, and no reminder time (fill in the dashboard box). Real A+ track, skip days on purpose. A gate, not evidence; gives tuned copy and a measured AI cost per user-day.
5. [ ] (Ali) Name 2 more testers (1 identified). **Add each tester's email to `PILOT_ALLOWED_EMAILS` at their day 0 or they cannot log in** (comma-separated; changing it restarts the backend). Create `.ai/pilot-log.md` at user 1's day 0. Day-0 inbox check: `FRONTEND_ORIGIN=https://learn.pakfro.dev node --env-file=../.env scripts/send_sample_nudge.mjs <email>` from `backend/` (sends real mail; without the override the link points at localhost).
6. [ ] (Ali) Bring over any remaining "phone smoke test" notes before the test starts.
7. [ ] (Ali) Resolve the Railway warning (open threads) before the test freezes prod.
8. [ ] (Ali) **Run the n=3**, prod frozen for 14 days.

**Decided:** the recall note stays inline, not a modal (the visible sign the app remembers, which is under test). The reminder box stays on the dashboard under the start button; only accounts with no reminder time see it. Em dashes remain only in the admin table's empty-value "—", the "— P" coach-note signature, and the Professor's live lesson text (a prompt change).

**Verifying locally:** Ali's Postgres (EDB, `/Library/PostgreSQL/18`) needs sudo, so use a throwaway cluster: `initdb` into the scratchpad, start with `-o "-p 5433 -c unix_socket_directories='' -c listen_addresses=127.0.0.1"`, apply all six migrations, run the backend with `env -i` and explicit vars (no Resend or AI keys = no email, free canned lessons, `PILOT_EXPOSE_DEV_CODE=true` shows the code). `frontend/.env.local` points at `localhost:3040`, so run the test backend on 3040. Comeback without waiting: onboard a user, then shift `pilot_student_events.local_date` and `occurred_at` back 3 days. The canned lesson has no `recall_note`. Ali's `.env` holds the real Resend key, so a login through `start:adaptation-runtime` sends real email.

**Live deploy reference**
- **Manual deploys:** `railway api 'mutation($s:String!,$e:String!,$c:String!){serviceInstanceDeployV2(serviceId:$s,environmentId:$e,commitSha:$c)}' --raw-var s=<serviceId> --raw-var e=<envId> --raw-var c=$(git rev-parse origin/main)` (IDs via `railway status --json`, run from the repo dir). Poll with `query($id:String!){deployment(id:$id){status}}`; each took under a minute. Push first (it deploys from GitHub). Backend before frontend when the frontend calls new routes. Railway CLI only; the plugin's connector is not authorized. If `git push` hangs, the macOS keychain is locked: push from Ali's own terminal.
- Project `pocket-professor`, env `production`: `Postgres`, `backend` (root `/backend`, port 3040, `backend-production-f74fcea6.up.railway.app`), `frontend` (root `/frontend`, `PORT=8080`, `learn.pakfro.dev`).
- Backend env: `NODE_ENV=production`, `ADAPTATION_PERSISTENCE_MODE=postgres`, `ADAPTATION_HOST=0.0.0.0`, `ADAPTATION_PORT=3040`, both DB URLs = `${{Postgres.DATABASE_URL}}`, `FRONTEND_ORIGIN=https://learn.pakfro.dev`, `ADMIN_EMAIL`, `PILOT_ALLOWED_EMAILS`, `RESEND_API_KEY` (send-only), `RESEND_FROM_EMAIL`, `NUDGE_ENABLED=true`, `NUDGE_MODE=send`, 3 AI keys. **Never** `PILOT_EXPOSE_DEV_CODE`. Frontend: `VITE_API_BASE_URL` (build-time).
- Migrations: `railway connect Postgres --tunnel-only --port <p>`, then `db:migrate:*` with `ADAPTATION_DATABASE_URL` at `127.0.0.1:<p>` (ADR-0024). Migration before code.
- AI in prod (measured 2026-11-15): every call served by OpenAI. Professor = `gpt-5.4-mini-2026-03-17`, Onboarding = `gpt-5.5-2026-04-23`.
- DNS at Porkbun; Resend DKIM/SPF/DMARC verified. A domain change means updating `FRONTEND_ORIGIN` (ADR-0023) and the `connect-src` in `frontend/public/serve.json`.

## Open threads
- **Railway deadline 2026-12-01 (unresolved):** the CLI warned `railway.json` config stops working then; the warning text was not re-read, so the date is as first noted. `railway config migrate --variables unmanaged --apply` wrote an untracked `.railway/railway.ts` (build and start commands, the domain, Postgres and its 5000 MB volume as managed resources; no restart policy in it). `migrate status` then said no production service reads Config as Code, contradicting the belief that both build from `railway.json`; unexplained. Cutover (redeploys each service) NOT run. Read the original warning first; IaC would take Postgres under management.
- **Login friction (watch, not a fix):** the email's "Open it here" goes to the site root; a tester with no saved session signs in (email, code, verify) and lands on the dashboard, not the lesson. A deep link or magic link needs an ADR naming new evidence, so record how often testers stall at login. A deep link must not start the session (AI call, counts a session).
- **Scope guard:** anything beyond a fix needs a new ADR naming new evidence. Rejected for now: a per-user daily AI call cap and a 16 KB input limit. **Post-test pile:** WTP test, vision steps 5–6, prompt-injection hardening, behavioral research, multi-mode.
- **Security, accepted or unmeasured:** lockout and throttle measured locally only, not under load on prod; someone who knows a tester's address can burn that tester's 20 codes a day; the admin student-file route logs the tester's email in the URL; sessions last 30 days unless the user logs out; 2 frontend advisories affect only the Vite dev server.
- **Nudge limits, accepted for the test:** a backend outage for a student's whole hour loses that day's nudge; a stop cannot be undone from the app (undo = SQL on `pilot_users.nudges_stopped_at`); a dropout is emailed daily until they press Stop.

## Next recommended step
Work through items 4 to 7 before day 0: user zero's reminder time, two more testers, the phone smoke-test notes, and the Railway warning.

## Out of scope
Vision steps 5–6, payments, exit report, recruiting/B2B, SMS/push (unless day-0 evidence), non-IT tracks; no prod deploys during the 14-day test.
