---
status: accepted
date: 2026-11-15
---
# Nudge delivery: an in-process minute timer that records the nudge before sending it, at most once a day

## Context and Problem Statement
Vision step 4: "at most one nudge a day arrives at the student's stated trigger time, is skipped if they've already done today's session, and is recorded in the student file" ([ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md)). [ADR-0028](0028-nudge-stop-link-confirms-on-the-frontend.md) records the stop link, the env flags and the midnight end of the catch-up window. The question here was how the nudge gets sent: what runs it, and what guarantees at most one a day.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: a pure decision function, a per-minute pass that records before it sends, and a timer inside the server process.

* **Decision** (`decideNudge`, `nudge.ts`, 717baf6): send from the reminder time until 60 minutes after it in the student's zone; nothing if stopped, already sent or skipped today, or the sprint is finished; `skip` if a session is already done today.
* **No nudge on the signup day** if the plan started at or after that day's reminder time, so nobody is emailed while still onboarding (b37653b, gotcha 22(d)).
* **Record first, then send** (`nudgeRunner.ts`, 717baf6): the pass inserts `nudge_sent`, and emails only if that insert went in. The unique index of [ADR-0036](0036-student-file-append-only-event-log.md) rejects a second `nudge_sent` for the same day, and that index is the whole "at most one a day" guarantee (gotcha 21(a)).
* **No retry:** a failed send writes `nudge_failed` and the day is spent (gotcha 21(b)).
* **Dry runs are rows too:** unless `NUDGE_ENABLED=true` and `NUDGE_MODE=send`, and the address passes `NUDGE_ALLOWLIST`, the pass writes `nudge_sent` with `dry_run: true` and emails nobody (gotcha 21(c)).
* **Timer:** a `setInterval` of one minute in `run_adaptation_fastify.mjs`, started only when `NUDGE_ENABLED=true`, skipping a tick while the previous pass is still running (5c1fcc4). The reason for an in-process timer over a scheduled job is not recorded.
* **Format** (2026-11-20): the nudge is sent as HTML and plain text, with the links in both; a test checks the links and their escaping (ab22a0b). The sender takes an optional HTML part; login emails stay plain text (af75ce2). The wording is frozen ([ADR-0040](0040-freeze-user-facing-copy-for-the-n3-test.md)).

### Consequences
* Good, because a crash, a restart or two overlapping passes can at worst lose a nudge, never send two.
* Good, because a dry run leaves the same trail in the student file as a real send, so the logic can be checked on production data before mail goes out.
* Bad, because a transient email failure costs the student that day's nudge.
* Bad, because the timer runs in the web process, so more than one backend instance would run more than one pass (the index still stops duplicates), and a server down for the whole hour sends nothing that day (inferred from the timer code).

## More Information
Evidence: 717baf6, 5c1fcc4 (2026-11-15), b37653b (2026-11-16), af75ce2, ab22a0b (2026-11-20); `backend/src/modules/student/nudge.ts`, `nudgeRunner.ts`, `backend/src/modules/email/sendEmail.ts`, `backend/scripts/run_adaptation_fastify.mjs` (nudge timer); `CLAUDE.md` gotchas 21, 22(d). Related: [ADR-0028](0028-nudge-stop-link-confirms-on-the-frontend.md).
