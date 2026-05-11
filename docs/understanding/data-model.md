# Understanding: Data Model

_Plain-English mental model. No TypeScript required._
_Updated by coding agent. Reflects both migration files._

---

## What it does

The database is split into two concerns: the **adaptation audit trail** (immutable evaluation records) and the **pilot user data** (accounts, sessions, agent interactions, feedback). They're intentionally separate — one is about the engine's decisions, the other is about the users.

---

## The tables

### Adaptation audit trail

**`adaptation_evaluations`**
Every time the adaptation engine runs for a user, one row is written here. It captures: which counters triggered which rules, what mutations were applied, what was deferred, and the full before/after state. This table is append-only — rows are never updated or deleted. It's the system's audit log and replay source.

---

### Pilot user data

**`pilot_users`**
Simple. One row per user. Email + user ID + timestamps. No password column — auth is handled by login codes.

**`pilot_login_codes`**
One row per code request. Stores the code as a SHA256 hash (never plaintext), when it expires, and when it was used. Codes are one-time use. No foreign key to `pilot_users` because the code is created before the user account exists.

**`pilot_sessions`**
One row per active session. Stores the session token as a SHA256 hash, expiry, and `last_seen_at` (updated on every authenticated request). Sessions live for 30 days.

**`pilot_agent_interactions`**
One row every time a user runs an agent. Stores the full input JSON, the full output JSON, the agent type, and optional user feedback (`helpful` boolean + comment). Both input and output are stored as JSONB — you can query what was said and what came back for any interaction.

**`pilot_feedback_events`**
One row per feedback submission. Tracks which UI component was rated (`component` field), whether it was helpful, and an optional comment. The `metadata_json` field can hold arbitrary context (e.g., which step in the flow the user was on). Used for analyzing what's working and what isn't during the pilot.

---

## What's not stored in the DB

**Session event counters** (missed sessions, late-night sessions, etc.) are computed upstream and passed to the adaptation engine at call time. The engine is stateless — it doesn't query the DB for counters. This is intentional: it keeps the engine fast and decoupled from the event storage layer.

---

## Key decisions and why

**Why JSONB for inputs and outputs?**
Agent inputs and outputs are structured but their schemas evolve. Storing them as JSONB means you can capture the full payload without a migration every time the schema changes, while still being able to query individual fields if needed.

**Why append-only for adaptation evaluations?**
The audit trail must be immutable to be trustworthy. If rows could be updated or deleted, you couldn't be sure what the engine actually decided. Every evaluation is permanent, queryable, and replayable.

**Why two separate migrations?**
The adaptation evaluation schema (migration 1) and the pilot user schema (migration 2) are independent concerns that were built at different times. Keeping them separate means you can roll back one without touching the other.

---

## Gotchas

- **`onboarding_drafts` table has a broken foreign key.** It references a `users(id)` table that doesn't exist yet (planned for a future phase). This migration will fail if run against a clean DB that has this table. Watch for this when running migrations — it may need to be dropped or commented out until Phase 4 adds the `users` table.
- **`pilot_agent_interactions` has `helpful` and `feedback_comment` columns directly on it.** There's also a separate `pilot_feedback_events` table. Feedback can be captured in both places — don't assume one is authoritative. Currently `pilot_feedback_events` is the primary feedback table; the columns on interactions are a secondary signal.
- **No soft deletes anywhere.** If you need to remove a user from the pilot, you'd need to manually delete their rows. There's no `deleted_at` column or deactivation flag.
- **Migration run order matters.** Run adaptation migration first (`db:migrate:adaptation:up`), then pilot (`db:migrate:pilot:up`). They're independent but the convention in the runbook is this order.

---

## Reading guide

To understand this subsystem, read in this order:

1. `backend/db/migrations/20260325_001_create_adaptation_evaluations.up.sql` — the adaptation audit table; read the column comments to understand what each field captures
2. `backend/db/migrations/20260411_002_create_pilot_tables.up.sql` — all five pilot tables; the schema tells you the system's full data model at a glance
3. `backend/docs/adaptation_evaluations_migration_runbook.md` — how to apply, verify, and roll back migrations safely
