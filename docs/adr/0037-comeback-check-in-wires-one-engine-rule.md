---
status: accepted
date: 2026-11-15
---
# The comeback check-in wires one engine rule: the gap decides when, the rule decides how much

## Context and Problem Statement
Vision step 3: "returning after 2+ missed days gets a shorter session and a no-guilt acknowledgement" ([ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md)). ADR-0025 wires the engine's missed-session rule for this and keeps the other four unwired, amending [ADR-0018](0018-do-not-wire-adaptation-engine-for-pilot.md). It does not record how. The engine rule `R_MISSED_2_IN_7D_REDUCE_WORKLOAD_25` fires on 2 or more misses in 7 days, which is not the same as "back after a gap". The question was how the check-in and the rule fit together.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: two separate conditions in `backend/src/modules/student/comeback.ts` (d23e543), kept apart on purpose (`CLAUDE.md` gotcha 20).

* **When:** today is a comeback day if the student has no session yet today and missed 2 or more days in a row right before today (`COMEBACK_MIN_MISSED_DAYS = 2`).
* **How much:** `evaluatePolicies` runs with the real 7-day miss count and the other four counters fed as zero or false. Its 25% cut is applied to the plan's minutes, rounded to the nearest 5, with a floor of 10, so a 10-minute plan is not shortened.
* It is the only live caller of the adaptation engine. A `comeback_checkin` event records it in the student file ([ADR-0036](0036-student-file-append-only-event-log.md)).
* On a comeback day the server sets the Professor's `minutes_available_today` and ignores the client's number (`run_adaptation_fastify.mjs`). If the canned lesson is served because every AI provider failed, its "N minutes" is rewritten to match; real AI output is not rewritten (`fitLessonToMinutes`, 5fe200c, gotcha 24(b)).
* The note is fixed copy in `comebackNote()`, frozen for the n=3 test ([ADR-0040](0040-freeze-user-facing-copy-for-the-n3-test.md)).
* The one-session-a-day gate and the 3-a-day cap (`MAX_SESSIONS_PER_DAY`, [ADR-0027](0027-keep-going-after-the-days-session.md)) are enforced only in the client; the server enforces neither (gotcha 20).

### Consequences
* Good, because "a gap" and "how much shorter" can each be changed without touching the other.
* Good, because the engine's threshold and its audit-tested behavior are reused, not copied.
* Bad, because the 2-day gap, the 25% and the floor of 10 are unsourced (ADR-0014) and now act on real users, which ADR-0018 had listed avoiding as a benefit.
* Bad, because a client that skips the gate can start more sessions than the design allows.

## More Information
Evidence: d23e543, 5fe200c, fb5fbf8 (note reworded 2026-11-20), `backend/src/modules/student/comeback.ts`, `backend/scripts/run_adaptation_fastify.mjs` (Professor route), `frontend/src/App.jsx` (`MAX_SESSIONS_PER_DAY`), `CLAUDE.md` gotchas 20, 24(b). Amends [ADR-0018](0018-do-not-wire-adaptation-engine-for-pilot.md), detailing the wiring that [ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md) decided. Related: [ADR-0003](0003-deterministic-rule-engine-for-adaptation.md), [ADR-0014](0014-provisional-engine-rule-order-pending-research.md).
