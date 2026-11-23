---
status: accepted
date: 2026-11-15
---
# The student file is one append-only events table per user; the database enforces once-a-day events

## Context and Problem Statement
[ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md) step 1 requires that "every session and miss for a user can be read back in order from one place". [ADR-0020](0020-defer-event-journal-rearchitecture-to-phase-4.md) deferred a full event journal with deterministic tick and replay to Phase 4, and ADR-0025 brought forward only the per-user log. Re-onboarding wipes `pilot_sprint_days` ([ADR-0016](0016-persisted-14-day-sprint-loop.md); migration 005 comment), so sprint days alone cannot hold the history.

## Considered Options
* The Phase 4 event journal with deterministic tick and replay (ADR-0020)
* One append-only per-user events table now

## Decision Outcome
Chosen option: "One append-only per-user events table now": `pilot_student_events` (`backend/db/migrations/20261115_005_create_student_events.up.sql`, d23e543). Recorded here so they are not undone:
* Events hang off the user, not the plan, so they survive re-onboarding (migration 005; gotcha 19c).
* Eight event types: `plan_started`, `session_completed`, `session_missed`, `comeback_checkin`, `nudge_sent`, `nudge_skipped`, `nudge_failed`, `nudge_stopped` (migration 005).
* A partial unique index allows at most one `session_missed`, `comeback_checkin`, `nudge_sent` and `nudge_skipped` per user per day. The index, not app code, enforces this (migration 005; gotcha 19b).
* Misses are written when something reads the file (plan load, day completion, the admin read), not on the missed day (gotcha 19a).
* Each event's `local_date` is in the user's time zone, `pilot_users.time_zone`, which the frontend sends; NULL means UTC (migration 005; gotcha 19).
* The server builds the Professor's `student_history` from the file; the client does not supply it (1b0fb29).
* Existing plans and completed days were backfilled with UTC dates, since zones were not stored before (migration 005).

### Consequences
* Good, because one table meets step 1's "done when" line and feeds steps 2 to 4 (ADR-0025).
* Good, because the once-a-day limit holds even if two writes race (inferred from the unique index).
* Bad, because a user who never returns has no miss rows until something reads their file (gotcha 19a).
* Bad, because migration 005 must be applied before the code, or `GET /pilot/plan` fails for every onboarded user (gotcha 19).
* Bad, because there is still no deterministic tick or replay; those stay deferred to Phase 4 (ADR-0020, ADR-0025).

## More Information
Evidence: d23e543, 1b0fb29, `backend/db/migrations/20261115_005_create_student_events.up.sql`, `backend/src/modules/student/`, gotcha 19. Amends [ADR-0016](0016-persisted-14-day-sprint-loop.md): history now survives re-onboarding, though the plan and its sprint days are still replaced. Related: [ADR-0020](0020-defer-event-journal-rearchitecture-to-phase-4.md), [ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md), [ADR-0048](0048-nudge-in-process-timer-insert-before-send.md).
