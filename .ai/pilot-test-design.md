# Pilot Test Design — n=3 silent efficacy test

Written 2026-08-13 (session 10), **before** any user sees the app.
Nothing in this file may be edited after day 0 of the first user. If the bar moves, the test is worthless.

## What this test is for

The belief that broke founder conviction (session 10): *"I don't know if I can build something that actually helps someone leave a job they hate — and if the moat is me, the software is worthless."*

That belief has never been tested. In eight months the repo records **zero** sit-down conversations with a target user.

This test asks one question: **does the software, with the founder silent, move someone to do something they would not have done alone?**

## Why the previous plan was replaced

The session-8/9 plan (10 paid users, founder manually running the 5 engine rules over SMS) is dead:

1. Its own written kill criterion fired — the founder would dread the daily texting, and a *successful* result would commit him to work he doesn't want.
2. It could not answer the question above. Wizard-of-Oz puts the founder in the loop **by design**, so a good result would be unattributable between the app and the person.

Willingness-to-pay is deferred, not abandoned. It is downstream of efficacy and moot if the answer here is no.

## Design

- **n = 3**, recruited from the founder's warm network. n=1 is uninterpretable on failure.
- **Unpaid.** No money changes hands. No payment link, no Stripe, no code.
- **14 days**, matching the built sprint length.
- **Founder is silent between day 0 and day 14.** No texts, no nudges, no "how's it going" — even while watching someone stall in the admin portal. The silence *is* the experiment.
- Two conversations only: day 0 (setup + pre-registration) and day 14 (measurement). These are the instrument, not coaching.

## Day 0 — script

Say it close to this. The permission-to-quit line is load-bearing: at n=3 friends, politeness compliance is the single biggest threat to a usable result.

> "I built a thing. I want to know if it's useless — that's genuinely the useful answer for me.
>
> Before I give it to you I want to write down one thing, then I'm going to leave you completely alone for two weeks. I won't text you about it, I won't check in. Then I'll ask you what you actually did.
>
> Use it or don't. Please don't use it to be nice to me — that's worse for me than you not using it at all."

Then hand over the URL and walk away. Do not watch them onboard. Do not explain the features.

## Day 0 — pre-registration

Record answers verbatim in `.ai/pilot-log.md` (create at first user; one section per person, initials only).

1. **"What's the one thing you've been meaning to do about getting out of your job that you haven't done?"**
   Push until it is specific and observable. "Look into IT" does not count. "Book the A+ exam", "finish the first Messer section", "put a resume together" do count. **This is the pre-registered action.** Write it in their words.
2. **"How long has that been sitting on your list?"**
   Under ~1 month = not a stalled thing; the test can't detect movement on it. Push for a different item.
3. **"What have you already tried?"** (courses started, videos watched, applications sent)
   Baseline of self-directed attempts. Someone who has never tried anything and someone who has abandoned three courses are different cases.
4. **"If nothing changes, how likely are you to actually do that thing in the next two weeks?"** (their own words, plus 1–10)
   This is the counterfactual, stated by them, before they know the outcome. It's the closest thing to a control this test has.
5. Contact + the agreed day-14 date. Put it in the calendar now.

## Day 14 — measurement

One conversation. Ask in this order, and do not lead:

1. "What did you actually do in the last two weeks?" (open, before mentioning the app)
2. "Did you do [pre-registered action]?" — yes / no / partially, with specifics
3. "What made you open it, the times you opened it?" — or "what made you stop?"
4. "If I took it away tomorrow, what would you miss, if anything?"

Then pull the DB numbers (`days_done`, per-day rows in `pilot_sprint_days`, `last_session_at`) and record them next to what they said. Self-report and telemetry disagreeing is itself a finding.

## Branch criteria — fixed before day 0

**PASS — the software has standalone value.**
≥1 of 3 completed their pre-registered action by day 14.
→ Continue. Next question becomes *why* it worked and for whom. Willingness-to-pay test comes after this, not before.

*Mechanism evidence (record, don't gate on it):* ≥1 of 3 opened the app on day 5 or later with zero contact from the founder. This is the signal that the **constraint** — one task, chosen for you, sized for a post-shift brain, no bingeing — is what they came back for.

**STOP — differentiation doubt confirmed.**
0 of 3 completed their action **and** all three stopped opening the app by day 5.
→ The repo becomes a portfolio artifact: a live URL and a written post-mortem. No pivot, no retest, no "one more feature." Eight months of real engineering did not need a business to have been worth doing.

**AMBIGUOUS — pre-decided responses, so there is no room to rationalize:**

| What happened | Reading | Response |
|---|---|---|
| Used the app most days, did nothing in the real world | The loop retains; the tasks don't convert to action | Not a stop. Narrow the next test to task quality — are the daily tasks actually the right next thing? |
| Did the action but abandoned the app by day 3 | They needed the *ask*, not the product. The day-0 conversation was the intervention | Points at coaching, which the founder does not want. Treat as STOP unless a second reading contradicts it. |
| No app use, no action, but they said the day-0 conversation helped | The conversation is the product | Service business, not software. Founder's call whether that's a business he wants; the code isn't it. |
| 2+ never onboarded at all | Recruiting/framing failure, not a product result | Test is void. Rerun once with different people. Once — not repeatedly. |

## Known threats to validity — stated up front, not discovered later

- **The day-0 conversation is itself an intervention.** Being asked by someone you know is a nudge. Question 4 partially controls for it; nothing at n=3 fully does. This test produces *evidence*, never proof.
- **Politeness confound.** Mitigated only by the day-0 framing. If a user's usage looks dutiful and evenly spaced with no real-world action, suspect it.
- **n=3, non-random, founder's network.** These are the most sympathetic possible users. A failure here is therefore more informative than a success.
- **The app dead-ends at day 14** ("Sprint complete", `frontend/src/App.jsx` ~:420). Deliberate. The day-14 conversation is the ending. Do not build an exit-report feature to fix this.

## What this test deliberately does NOT test

Willingness to pay · founder-led coaching · the adaptation engine (unwired, and not in the live path) · recruiting/funnel · retention past 14 days · anything about scale.

## Hard rules

1. No edits to this file after day 0 of user 1.
2. No contact between day 0 and day 14, including replies to unprompted messages about the app beyond "I'll ask you everything on the 14th."
3. Log the result against these criteria the same week it ends, before deciding anything.
