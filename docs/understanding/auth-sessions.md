# Understanding: Auth & Sessions

_Plain-English mental model. No TypeScript required._
_Updated by coding agent. Reflects current pilot auth implementation._

---

## What it does

Users log in with their email only — no password. They get a 6-digit code sent to their inbox, enter it, and receive a session token that keeps them logged in for 30 days. Every protected API call uses that token to prove who they are.

---

## How it works (concept walkthrough)

**Step 1 — Request a code**
User submits their email. The system generates a random 6-digit code, stores a SHA256 hash of it (never the code itself), and emails it via Resend. The code expires in 15 minutes.

**Step 2 — Verify the code**
User submits their email + the code. The system hashes the code, finds the matching record, checks it hasn't expired and hasn't been used before, then marks it as used (one-time use). The user account is created if it doesn't exist yet (upsert). A session token is generated, hashed, and stored. The plaintext token is returned to the client — this is the only time it's ever seen in plaintext.

**Step 3 — Authenticated requests**
The client stores the token and sends it as a `Bearer` token in the `Authorization` header on every request. The server hashes the incoming token, looks it up in `pilot_sessions`, checks it hasn't expired, and updates `last_seen_at`. If all that passes, the request goes through.

---

## Key decisions and why

**Why no password?**
Pilot users are service industry workers who use apps casually. Passwords add friction and support burden (forgot password flows). A magic code to their email is something everyone understands. For a pilot, this is the right tradeoff.

**Why hash codes and tokens in the DB?**
If the database were ever read by someone who shouldn't, they couldn't extract working session tokens or replay login codes. The plaintext token only exists on the client. The server only ever stores and compares hashes.

**Why 30-day sessions?**
These are shift workers. They might go two weeks without opening the app, then pick it up again. A short session TTL (e.g., 24 hours) would constantly kick them out and frustrate them. 30 days is generous but appropriate for the use case.

---

## Gotchas

- **No logout endpoint.** Logging out means the client discards the token locally. The session record stays in the DB until it expires. This is intentional for the pilot — simple to implement, low risk at small scale.
- **No rate limiting on code requests.** Someone could request many codes for the same email. Not a real threat for a 1–12 user pilot, but worth adding before any wider release.
- **Local dev fallback.** If `RESEND_API_KEY` is not set, the login code is logged to stderr instead of being emailed. The response also includes a `dev_code` field with the plaintext code. This is intentional for local testing — but make sure those env vars are set in production or real users won't receive their codes.
- **Email normalization.** Emails are lowercased and trimmed before storage. `User@Example.com` and `user@example.com` are treated as the same account.
- **Codes exist before users.** `pilot_login_codes` has no foreign key to `pilot_users` — a code is issued before the account is created. The account is created (or found) during the verify step, not the request step.

---

## Reading guide

To understand this subsystem, read in this order:

1. `backend/db/migrations/20260411_002_create_pilot_tables.up.sql` — start with the schema; understand `pilot_users`, `pilot_login_codes`, `pilot_sessions` before reading any code
2. `backend/scripts/run_adaptation_fastify.mjs` lines 191–263 — the two auth routes (request + verify) and the `requireSession` helper; the whole auth system lives here
