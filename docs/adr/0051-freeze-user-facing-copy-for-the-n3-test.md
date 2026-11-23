---
status: accepted
date: 2026-11-20
---
# Freeze user-facing copy for the n=3 test: sentence case, no em dashes, fixed nudge and comeback wording, recall note inline

## Context and Problem Statement
The n=3 test runs 14 days on a frozen production app with the founder silent ([ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md)). The nudge and comeback wording is part of what is tested: "a first guess, frozen for 14 days. A null may be the wording, not the mechanism" (`.ai/pilot-test-design.md`, threats to validity; `.ai/vision.md`, "Judgment"). ADR-0021 and ADR-0025 mention freezing the app but record no copy conventions. Before the test, the copy got one last pass. The question was what that pass settles.

## Considered Options
* Recall note as a modal, or inline in the session (`.ai/handoff.md`, "Decided")
* (other alternatives not recorded)

## Decision Outcome
Chosen option: one copy pass on 2026-11-20, then no wording changes for the 14 days. The reason for sentence case and for dropping em dashes is not recorded beyond the commits.

* **Sentence case** in user-facing text, including the nudge subject and body and the comeback note (fb5fbf8, ab22a0b, `.ai/handoff.md:7`). The nudge subject reads "Hey, this is The Professor", with "The Professor" capitalized as a name (a459994).
* **No em dashes in user-facing frontend copy:** replaced with periods, commas or colons across feedback, plan, session, dashboard, admin draft messages and onboarding (cb6fc82).
* **Documented exceptions:** the admin table's em-dash placeholder for an empty value, the coach-note signature (an em dash, then "P"), and the Professor's live AI lesson text, since changing that is a prompt change (`.ai/handoff.md`, "Decided").
* **Frozen wording** in code, each marked as a variable under test: `nudgeEmail()` in `backend/src/modules/student/nudge.ts` and `comebackNote()` in `backend/src/modules/student/comeback.ts` (`CLAUDE.md` gotchas 20, 21(f)).
* **The recall note stays inline, not a modal,** because it is the visible sign the app remembers, which is under test (`.ai/handoff.md`, "Decided", 7e4e6db).
* Copy also reworded in the pass: the after-session line, the risk step (which had promised "instead of clock times" one screen before asking for a clock time) and the not-on-the-list login error (591f18d).

### Consequences
* Good, because all three testers see the same words for 14 days, so differences between them are not copy changes.
* Bad, because the wording is a first guess with no user evidence, and a null result cannot rule it out as the cause (`.ai/pilot-test-design.md`).
* Bad, because the Professor's AI lesson text can still contain em dashes.

## More Information
Evidence: cb6fc82, 591f18d, fb5fbf8, ab22a0b, a459994 (2026-11-20), 7e4e6db; `.ai/pilot-test-design.md`, `.ai/vision.md`, `.ai/handoff.md:7`, `:21`; `CLAUDE.md` gotchas 20, 21. Not recorded anywhere, so not part of this decision: a rule of "I" for the Professor and "we" for system messages; the current copy mixes the two (for example `frontend/src/onboarding/steps/Done.jsx`). Related: [ADR-0047](0047-comeback-check-in-wires-one-engine-rule.md), [ADR-0048](0048-nudge-in-process-timer-insert-before-send.md).
