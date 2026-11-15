# Pocket Professor: Product Vision

_v1.1, 2026-11-14 (v1: 2026-10-15, from a brainstorm with Ali). This is the end state, not a schedule or a commitment. What gets built and when is decided in `.ai/handoff.md`. The n=3 test is governed by its ADR and `.ai/pilot-test-design.md`, not by this doc._

## The one-liner
A professor, academic advisor and career coach who share one persistent memory of you, reach out first, check what you actually did, and keep you pointed at a job. On the surface: one thing to do today.

## Why a chat box can't do this
| Chat AI | Pocket Professor |
|---|---|
| Starts from zero every conversation | Remembers you for months: what you passed, what you struggle with, when you go quiet |
| Waits for you to ask | Reaches out at the time you said you'd study |
| Assumes watching = learning | Checks understanding and asks for proof (answers, labs, artifacts) |
| Measures progress by lessons finished | Measures progress against getting hired |
| Infinite options | One task, sized for a post-shift brain |

## The roles

**Professor: teaches around content, never writes curriculum**
- Assigns today's external content (Professor Messer etc.), then checks understanding with short back-and-forth questions.
- Keeps a map of the A+ objectives: solid / shaky / untouched. Brings shaky items back on a spaced schedule.
- Small hands-on labs with proof (e.g. run `ipconfig /all` in a VM, paste output, identify the default gateway).
- Explains through the student's previous job.

**Academic advisor: owns the plan and the pace**
- Sizes each day to the student's real energy and schedule.
- Notices absences without guilt ("want a 10-minute version today?").
- Weekly review: what moved, what's stuck, is the exam date still realistic.
- Spots patterns (always skips Thursdays, abandons every networking session). This is the adaptation engine, wired up and talking to the student.

**Career coach: turns learning into a job**
- Translates the old job into IT language for a resume.
- Builds a proof portfolio from completed labs.
- Mock interviews (voice ideally); says when the student is ready to apply.
- Tracks applications; outreach scripts; real local job postings.

**Shared layer**
- **Student file:** one persistent record all three roles read and write. Enables handoffs (advisor spots topic resistance → coach conversation = engine rule 1).
- **Outreach channel:** a message at the student's trigger time. Email first; text or push later.
- **Human escalation:** founder or mentor for what the AI shouldn't handle.

## Beyond IT (someday)
IT support is the first version, not the ceiling. The end state is anyone learning toward the field they want to work in, not only people who want out of their job. For gated professions (e.g. nursing), PP can't certify anyone or replace the school; it preps people to get in and to get through. The three roles and the shared layer stay the same; the track and the coach's target change. Not before the n=3 result; see `.ai/product-direction-multi-mode-learning.md` and ADR-0015.

## Where the repo sits (2026-10-15)
Live at `learn.pakfro.dev` since 2026-11-14 (redeploy only). No build step has started.

| Vision | Today |
|---|---|
| Intake | Onboarding flow, live |
| Pacing gate | One-session-per-day gate, live |
| Professor | Single-shot lesson, no memory, no checking |
| Advisor | Adaptation engine built, not wired (no client calls `/adaptation/`) |
| Coach | Agent built, not called by the frontend |
| Student file | Doesn't exist (biggest gap) |
| Outreach | No nudges. Email sending exists (Resend), used for login codes only |
| Proof of learning | Doesn't exist |
| Comeback after missed days | Resumes at next day, no backlog, but doesn't notice the absence (`App.jsx` `nextDay = doneCount + 1`) |

The core gap is **memory + initiative**, not more agents.

## Build order (dependency chain)
Each step has a "done when" so testing doesn't collapse into building. Steps 1–4 close the core gap, memory (1–2) then initiative (3–4), and are what the n=3 test runs on. Steps 5–6 reach users after the result.

1. **Student file.** A per-user event log (sessions, answers, misses, check-ins, nudges sent). Essentially the Phase 4 event journal.
   _Done when:_ every session and miss for a user can be read back in order from one place.
2. **Professor reads it.**
   _Done when:_ a lesson references something from 3+ days ago without being told.
3. **Comeback check-in** (advisor; wire the missed-session rule).
   _Done when:_ returning after 2+ missed days gets a shorter session and a no-guilt acknowledgement.
4. **Outreach.** Email first; text and push later. This is how the advisor reaches someone who hasn't come back, not only someone who has.
   _Done when:_ at most one nudge a day arrives at the student's stated trigger time, is skipped if they've already done today's session, and is recorded in the student file.

_The n=3 test runs here._

5. **Proof of learning.** Check-for-understanding questions, labs, objective map.
   _Done when:_ the objective map changes based on answers, not on sessions finished.
6. **Career coach.**
   _Done when:_ it produces a resume bullet or portfolio entry from the student's own history.

## Decided: what the n=3 test tests
_Decided 2026-11-14. Summary only. The binding version is ADR-0025 and `.ai/pilot-test-design.md`._

The test runs on steps 1–4, each at its "done when" line, with email as the only outreach channel.

Unchanged: the question (does a stalled person act within 14 days, founder silent from day 0 to day 14?) and the bar (at least 1 of 3).

Why this slice:
- **Not the thin app (v1 option A).** A null wouldn't be believed: it can't separate "thesis wrong" from "memory and comeback were missing."
- **Not steps 1–3 (v1 option B).** The comeback check-in only reaches people who come back, so silent drop-off would still read as a weak thesis.
- **Not steps 5–6.** They mostly govern week 3 onward; a 14-day test barely sees them.

What gets tested is memory, initiative and one task a day: rows 1, 2 and 5 of the chat-box table. Checking, proof and the coach are not in it. More scope before the test takes a new ADR naming new evidence.

## What building can't solve
- **Judgment:** what to say to someone ashamed after 4 missed days is learned from real users, not designed upfront. Steps 3–4 ship a first guess anyway, and the test freezes it for 14 days with the founder silent. Treat that wording as a variable under test, not a settled design.
- **Motivation:** information was never the bottleneck. The bet is that follow-up and "someone noticed" move people.
- **Option creep:** a full-featured PP can become the paralyzing menu again. The surface stays one task per day by default (a student can opt to keep going, ADR-0027), and the inbox counts as surface: one nudge, one task.
- **The last mile:** AI can make someone interview-ready, not hired. The first outcome story comes from a real person.
