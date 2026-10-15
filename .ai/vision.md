# Pocket Professor: Product Vision

_Written 2026-10-15 from a brainstorm with Ali. This is the end state, not a build order or a commitment. What gets built and when is decided in `.ai/handoff.md`._

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
- **Outreach channel:** text or push at the student's trigger time.
- **Human escalation:** founder or mentor for what the AI shouldn't handle.

## Where the repo sits (2026-10-15)
| Vision | Today |
|---|---|
| Intake | Onboarding flow, live |
| Pacing gate | One-session-per-day gate, live |
| Professor | Single-shot lesson, no memory, no checking |
| Advisor | Adaptation engine built, not wired (no client calls `/adaptation/`) |
| Coach | Agent built, not called by the frontend |
| Student file | Doesn't exist (biggest gap) |
| Outreach | Doesn't exist |
| Proof of learning | Doesn't exist |
| Comeback after missed days | Resumes at next day, no backlog, but doesn't notice the absence (`App.jsx` `nextDay = doneCount + 1`) |

The core gap is **memory + initiative**, not more agents.

## Build order (dependency chain)
Each step has a "done when" so testing doesn't collapse into building.

1. **Student file.** A per-user event log (sessions, answers, misses, check-ins). Essentially the Phase 4 event journal.
   _Done when:_ every session and miss for a user can be read back in order from one place.
2. **Professor reads it.**
   _Done when:_ a lesson references something from 3+ days ago without being told.
3. **Comeback check-in** (advisor; wire the missed-session rule).
   _Done when:_ returning after 2+ missed days gets a shorter session and a no-guilt acknowledgement.
4. **Outreach.**
   _Done when:_ a nudge arrives at the student's stated trigger time, and stops when they've done today's session.
5. **Proof of learning.** Check-for-understanding questions, labs, objective map.
   _Done when:_ the objective map changes based on answers, not on sessions finished.
6. **Career coach.**
   _Done when:_ it produces a resume bullet or portfolio entry from the student's own history.

## Open decision: what the n=3 test tests
The handoff rule is "nothing new gets built until the n=3 test produces a result." That rule predates this vision.

- **A. Test the current thin version first.** Cheap and ready. Risk: a 0/3 result can't separate "thesis wrong" from "memory and comeback were missing."
- **B. Build the minimal slice (steps 1–3), then test.** Tests the actual thesis. Costs weeks; requires updating `.ai/pilot-test-design.md` (allowed until user 1 starts).

Claude's lean: B, kept minimal. Undecided; Ali's call.

## What building can't solve
- **Judgment:** what to say to someone ashamed after 4 missed days is learned from real users, not designed upfront.
- **Motivation:** information was never the bottleneck. The bet is that follow-up and "someone noticed" move people.
- **Option creep:** a full-featured PP can become the paralyzing menu again. The surface stays one task per day.
- **The last mile:** AI can make someone interview-ready, not hired. The first outcome story comes from a real person.
