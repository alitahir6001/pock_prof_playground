---
status: accepted
date: 2026-11-15
---
# Nudges run on a once-a-minute timer inside the backend; recording before sending keeps it to one a day

## Context and Problem Statement
[ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md) step 4 requires that "at most one nudge a day arrives at the student's stated trigger time, is skipped if they've already done today's session, and is recorded in the student file". Something has to check each student's time and send the email.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: "An in-process timer in the backend server": a `setInterval` every 60 seconds that skips a pass while the previous one is still running, off unless `NUDGE_ENABLED=true` (`backend/scripts/run_adaptation_fastify.mjs:791-812`; 5c1fcc4). The decision is a pure function, `decideNudge` (`backend/src/modules/student/nudge.ts`), and the pass is `runNudgeTick` (`backend/src/modules/student/nudgeRunner.ts`; 717baf6). The runner inserts `nudge_sent` before sending and sends only if the insert went in. With the unique index from [ADR-0046](0046-student-file-append-only-events-table.md), that is the whole at-most-one-a-day guarantee (717baf6; gotcha 21a). A failed send writes `nudge_failed` and is not retried that day (gotcha 21b). The catch-up window, send modes, allowlist and stop link are in [ADR-0028](0028-nudge-stop-link-confirms-on-the-frontend.md).

### Consequences
* Good, because there is no separate scheduler, worker or queue to deploy (inferred from `backend/railway.json`, which starts only `start:prod`).
* Good, because a crash between insert and send loses a nudge rather than sending two (inferred from gotcha 21a).
* Bad, because a backend outage for a student's whole hour loses that day's nudge (`.ai/handoff.md:38`, accepted for the test).
* Bad, because a student who drops out is emailed daily until they press Stop (`.ai/handoff.md:38`).

## More Information
Evidence: 5c1fcc4, 717baf6, `backend/scripts/run_adaptation_fastify.mjs:791-812`, `backend/src/modules/student/nudge.ts`, `backend/src/modules/student/nudgeRunner.ts`, gotcha 21, `.ai/handoff.md:38`. Related: [ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md), [ADR-0028](0028-nudge-stop-link-confirms-on-the-frontend.md), [ADR-0039](0039-resend-for-app-email.md), [ADR-0046](0046-student-file-append-only-events-table.md).
