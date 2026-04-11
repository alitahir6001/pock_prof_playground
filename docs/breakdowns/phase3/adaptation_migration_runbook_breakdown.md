# File Breakdown: `backend/docs/adaptation_evaluations_migration_runbook.md`

## Layman translation
### Here's what it means in plain terms
- This runbook tells operators exactly how to apply, verify, and roll back the adaptation DB migration.

### Why it's built
- It reduces migration risk by providing deterministic command sequences and checks.

### How it helps a service worker switch careers
- It lowers outage/misconfiguration risk so adaptation guidance remains available.

## What this file does
- Defines migration scope and prerequisites (env vars, permissions, backup posture).
  - **In plain English:** sets clear readiness conditions before touching production data.
- Provides copy/paste commands for apply (`up`) and rollback (`down`).
  - **In plain English:** gives a repeatable operator playbook.
- Provides verification queries for table/index presence.
  - **In plain English:** confirms migration success with concrete evidence.
- Documents runtime usage in Postgres mode after apply.
  - **In plain English:** bridges schema migration into actual service startup.
- Includes failure-handling notes.
  - **In plain English:** tells teams what to do when migration fails.
