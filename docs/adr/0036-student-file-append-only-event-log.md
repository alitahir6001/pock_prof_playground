---
status: accepted
date: 2026-11-15
---
# The student file is an append-only per-user event log, with lazy misses and one-per-day rules in a database index

## Context and Problem Statement
Vision step 1 needed one place where "every session and miss for a user can be read back in order" ([ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md)). Sprint days live in `pilot_sprint_days`, which `POST /pilot/plan` wipes on re-onboarding (migration 005 header). ADR-0020, 0025 and 0027 name the student file but not its shape. The question was how to store it.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: one table, `pilot_student_events`, written only by inserts (d23e543, migration `20261115_005_create_student_events.up.sql`). The reasons below are the ones the migration and code give.

* **Keyed to the user, not the plan**, so the history survives re-onboarding.
* **A fixed set of event types** checked by the database: `plan_started`, `session_completed`, `session_missed`, `comeback_checkin`, and four nudge types.
* **"Today" is the user's own calendar day.** Each event stores `local_date` in `pilot_users.time_zone`, fixed when written; NULL means UTC. The frontend sends the zone on boot.
* **Misses are written lazily.** Nothing happens on a missed day, so `loadStudentFile` records any due misses when it next reads the file: on plan load, day completion and the admin read (`studentFileStore.ts`). A user who never returns has no miss rows until something reads their file.
* **One-per-day rules live in the database.** The partial unique index `uq_pilot_student_events_daily` on (user, type, date) for misses, comeback check-ins, `nudge_sent` and `nudge_skipped` is what enforces "at most one a day", not app code.
* Existing plans and completed days were backfilled with UTC dates, since zones were not stored before.

### Consequences
* Good, because one ordered read gives the Professor, the comeback check and the admin view the same history.
* Good, because a duplicate miss or nudge is refused by the database even when two requests race.
* Bad, because miss rows depend on a later read, so the table alone undercounts misses for students who stopped.
* Bad, because migration 005 must be applied before this code is deployed, or `GET /pilot/plan` fails for every onboarded user (gotcha 19).
* Bad, because a wrong or missing time zone puts events on the wrong day (gotcha 21, local test trap).

## More Information
Evidence: d23e543, migration 005, `backend/src/modules/student/studentFile.ts`, `studentFileStore.ts`, `CLAUDE.md` gotcha 19. The POC repo had an untyped per-user event table first ([ADR-0031](0031-rebuild-on-node-typescript-and-postgres.md)). Builds the per-user log that [ADR-0020](0020-defer-event-journal-rearchitecture-to-phase-4.md) deferred; deterministic tick and replay stay deferred. Read by [ADR-0037](0037-comeback-check-in-wires-one-engine-rule.md) and [ADR-0038](0038-nudge-delivery-record-before-send.md).
