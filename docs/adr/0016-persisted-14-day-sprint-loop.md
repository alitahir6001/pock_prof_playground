---
status: accepted
date: 2026-06-14
---
# Persisted 14-day sprint loop with one Professor session per day

## Context and Problem Statement
A walkthrough showed the flow dead-ended after onboarding and one in-memory task, so whether users return was unmeasurable (`.ai/history.md`, session 7).

## Considered Options
* Keep a single in-memory task
* Persisted sprint loop
* A built day-14 Exit Report feature (out of scope; the report stays founder-written and the app deliberately ends at day 14, `CLAUDE.md:138`)

## Decision Outcome
Chosen option: "Persisted sprint loop": tables `pilot_plans` and `pilot_sprint_days` (migration 003, `backend/db/migrations/20260413_003_create_sprint_tables.up.sql`), one Professor session per day, switching track keeps progress, re-onboarding replaces the plan and its days, and day 14 shows "Sprint complete" with no next step (`CLAUDE.md:138`). Shipped in 8195b42 (backend) and ed724be (frontend). Product view: `docs/what-is-pocket-professor.md:96-97`.

### Consequences
* Good, because `completed_at` gaps give a real return signal (migration 003 comments).
* Bad, because one plan per user means re-onboarding discards history.

## More Information
Evidence: 8195b42, ed724be, migration 003, `CLAUDE.md:138`, `docs/what-is-pocket-professor.md:96-97`, `.ai/history.md`. Related: [ADR-0021](0021-n3-unpaid-founder-silent-efficacy-test.md). Amended by [ADR-0027](0027-keep-going-after-the-days-session.md): one session a day is the default, with an opt-in "keep going" up to 3 a day. Amended by [ADR-0041](0041-student-file-append-only-events-table.md): the student file keeps a user's history across re-onboarding.
