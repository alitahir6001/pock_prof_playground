# File Breakdown: `backend/db/migrations/20260325_001_create_adaptation_evaluations.up.sql`

## Layman translation
### Here's what it means in plain terms
- This SQL file creates the database table that stores adaptation decisions and audit context.

### Why it's built
- It provides durable, queryable history for Phase 3 when running in Postgres mode.

### How it helps a service worker switch careers
- It preserves a reliable record of why plan adjustments happened, which helps keep guidance consistent over time.

## What this file does
- Starts a transaction (`BEGIN`) and creates `adaptation_evaluations` if missing.
  - **In plain English:** applies schema changes safely and idempotently.
- Defines columns for evaluation id, user id, timestamps, trigger window, applied rules, mutations, state snapshots, deferred mutations.
  - **In plain English:** stores both the decision and the surrounding context for audits.
- Adds performance indexes on `(user_id, evaluation_time DESC)` and `(created_at DESC)`.
  - **In plain English:** makes recent-history lookups fast.
- Commits transaction.
  - **In plain English:** schema updates are all-or-nothing.
