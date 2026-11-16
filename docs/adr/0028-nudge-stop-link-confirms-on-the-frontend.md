---
status: accepted
date: 2026-11-15
---
# The nudge email's stop link opens a confirm page and stops by POST, not by a GET route

## Context and Problem Statement
ADR-0025 step 4 sends each student at most one reminder email a day. The approved build plan gave that email a stop link, `GET /pilot/nudge/stop?token=…`, which would switch reminders off the moment the URL was fetched. Mail providers and security scanners fetch the links in incoming mail before the person reads it. In a 14-day test with three people, a reminder silently switched off by a scanner would look the same in the data as a student who chose to stop, and the test protocol reads a stop as evidence (`.ai/pilot-test-design.md`).

## Considered Options
* A GET route on the backend that stops reminders when fetched (the approved plan)
* A link to a frontend page (`/#stop=<token>`) with a button that sends a POST
* No stop link

## Decision Outcome
Chosen option: "A link to a frontend page (`/#stop=<token>`) with a button that sends a POST", because fetching the link changes nothing; only a person pressing the button does.

Settled in the same build, and recorded here so they are not undone by accident:
* The token is a random per-user value in `pilot_users.nudge_stop_token`, created with the first reminder time. A stored column needs no new production secret; a signed token would.
* The 60-minute catch-up window stops at midnight in the student's zone, so a late nudge is never filed under the next date. A 23:30 reminder has 30 minutes of catch-up.
* The reminder time is required in onboarding, because the test protocol assumes every tester gets the nudge.
* Mail is only sent when `NUDGE_ENABLED=true` and `NUDGE_MODE=send`. In send mode an empty `NUDGE_ALLOWLIST` means everyone; a non-empty one limits real mail to the listed addresses.

### Consequences
* Good, because a mail scanner cannot switch a student's reminders off.
* Good, because the link sits on the same domain the student already uses, and the token is in the URL fragment, which browsers do not send to servers.
* Good, because the stop is recorded once as `nudge_stopped`, however many times the button is pressed.
* Bad, because stopping takes two actions (open, press) instead of one.
* Bad, because the stop page needs the frontend to be up and to load JavaScript.
* Bad, because there is no way to turn reminders back on from the app; a stop is final unless changed in the database.

## More Information
Evidence: commits 717baf6 (decision logic, runner), 5c1fcc4 (`POST /pilot/nudge/stop`, timer), 8f3050c (stop page); `backend/src/modules/student/nudge.ts`, `backend/src/modules/student/nudgeRunner.ts`; migration `20261115_006_add_nudge_settings.up.sql`; `CLAUDE.md` gotcha 21. That scanners fetch links is general knowledge about mail systems, not something measured in this project. The stop route was verified at the API on a local run (bad token 400, real token 200, a second press adds no second event); it has not been clicked from a delivered email. Related: ADR-0025 (the test runs on steps 1–4), ADR-0026 (Claude writes, the founder reviews).
