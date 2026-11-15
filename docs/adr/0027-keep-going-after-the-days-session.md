---
status: accepted
date: 2026-11-15
---
# Let a student keep going after the day's session; one task a day stays the default

## Context and Problem Statement
The app hides the start button after one completed session until the next calendar day (ADR-0016). ADR-0025 names one task a day as one of three things under test. In the phone smoke of the live app (2026-11-15) the founder, as user zero, finished the day's session, wanted to continue, and could not. The question was whether a student who wants to do more should be stopped.

## Considered Options
* Keep the hard gate
* One task a day by default, with an opt-in "keep going" after it is done
* Remove the gate

## Decision Outcome
Chosen option: "One task a day by default, with an opt-in "keep going" after it is done", because the gate exists to give structure, not to turn away someone who wants to work. After the day's session is marked done, the dashboard still says the day is done, and offers a secondary "Keep going" action that starts the next session. Nothing prompts the student to do more. Each extra session is the next sprint day, counts toward the 14, and is its own `session_completed` row in the student file. At most 3 sessions per calendar day. The nudge is still skipped once one session is done that day. On a comeback day the first session is the shorter one; "keep going" replaces the full-length link in the approved step 3 plan.

### Consequences
* Good, because a motivated student is not turned away at the moment they want to work.
* Good, because sessions per day are recorded, so day 14 can tell one-a-day use from bursts.
* Bad, because it loosens "one task a day", so a pass can be credited to the constraint less cleanly.
* Bad, because the evidence is one person, the founder, who is more motivated than the target user.
* Bad, because a sprint can now end as early as day 5, after which the app dead-ends and nudges stop.
* Bad, because the cap of 3 is unsourced, and this is the third growth in pre-test scope.

## More Information
Evidence: `.ai/handoff.md` "Open threads" (smoke feedback 2026-11-15). Amends [ADR-0016](0016-persisted-14-day-sprint-loop.md) and [ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md). Built with step 3.
