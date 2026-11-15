---
status: accepted
date: 2026-11-14
---
# Run the n=3 founder-silent test on vision build steps 1–4, with email outreach

## Context and Problem Statement
ADR-0021 froze the n=3 test on the app as deployed and said nothing new is built until a result. That app has no memory and no initiative (`.ai/vision.md`, "Where the repo sits"). A bootcamp's accountability came partly from tuition paid and fixed hours. A free app with short sessions has neither, so accountability has to come from the app remembering the student and reaching out first. The question was what the test should run on.

## Considered Options
* The thin app as deployed (ADR-0021)
* Vision steps 1–3
* Vision steps 1–4
* Vision steps 1–6

## Decision Outcome
Chosen option: "Vision steps 1–4", each built to its "done when" line in `.ai/vision.md` v1.1:

1. Student file. "every session and miss for a user can be read back in order from one place."
2. Professor reads it. "a lesson references something from 3+ days ago without being told."
3. Comeback check-in. "returning after 2+ missed days gets a shorter session and a no-guilt acknowledgement."
4. Outreach. "at most one nudge a day arrives at the student's stated trigger time, is skipped if they've already done today's session, and is recorded in the student file."

Outreach is email only, via Resend. Because a 0 of 3 on the thin app would not be believed: it cannot separate "thesis wrong" from "memory and comeback were missing". Steps 1–3 alone leave silent drop-off unaddressed, since a comeback check-in only reaches people who come back. Steps 5–6 mostly matter from week 3, which a 14-day test barely sees.

Unchanged from ADR-0021: the question (does the software, with the founder silent, move a stalled person to act within 14 days), n=3, unpaid, the pre-registered action, the bar of at least 1 of 3, and branch criteria frozen before day 0. Automated app email is the product under test, not founder contact. Any scope beyond steps 1–4 before the test needs a new ADR naming new evidence.

### Consequences
* Good, because a null result is now informative about memory and initiative, not only about the gate.
* Bad, because a return can be caused by a nudge, so the test no longer isolates the constraint as the mechanism.
* Bad, because pre-test scope has grown twice (thin, then 1–3, then 1–4) and the test starts later.
* Bad, because the missed-session threshold is unsourced (ADR-0014) and will now drive real users; ADR-0018 listed avoiding that as its benefit.

## More Information
Evidence: eed88fc, 5f0c6a6, `.ai/vision.md` "Decided", `.ai/pilot-test-design.md`. Supersedes [ADR-0021](0021-n3-unpaid-founder-silent-efficacy-test.md). Amends [ADR-0018](0018-do-not-wire-adaptation-engine-for-pilot.md): the missed-session rule is wired for step 3; the other four rules stay unwired. Amends [ADR-0020](0020-defer-event-journal-rearchitecture-to-phase-4.md): the per-user event log is built for step 1; deterministic tick and replay stay deferred to Phase 4. Amended by [ADR-0027](0027-keep-going-after-the-days-session.md): one task a day is a default the student can step past, up to 3 sessions a day.
