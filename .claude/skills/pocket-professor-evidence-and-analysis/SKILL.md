---
name: pocket-professor-evidence-and-analysis
description: How a hunch becomes an accepted result in Pocket Professor - analysis recipes (premise teardown, build-vs-buy, discriminating experiment, root-cause) each with a worked example from this repo's history, plus where results get recorded. Triggers - "should we", "I think the bug is", "is it worth", evaluating a strategy or library choice, investigating a weird failure, pilot data interpretation, deciding what to build next, challenging something the docs claim.
---

# Pocket Professor — Evidence & Analysis

This project's history shows a consistent pattern: **hunches are cheap, and half of them were wrong until tested against the live system.** These recipes are how claims got promoted to decisions here. Every example below actually happened in this repo.

**When NOT to use this skill:** you already know what to do and just need commands → `pocket-professor-runbook`; the question is "am I allowed" → `pocket-professor-change-control`.

## The promotion ladder

1. **Hunch** — stated in conversation. Worth nothing yet.
2. **Code-grounded claim** — you read the actual source (not CLAUDE.md's summary of it) and can cite file:line.
3. **Demonstrated result** — a test, smoke, curl, or reproduction shows it (evidence bar: runbook §Validation bar).
4. **Decision** — strategic calls go to the founder with a recommendation, not an option survey. Technical facts don't need his sign-off, but user-visible behavior changes do.
5. **Recorded** — handoff.md (state), CLAUDE.md gotcha (permanent trap), `.ai/` strategy doc (direction). Unrecorded results die with the session.

**House rule: docs are hypotheses, code is evidence.** Verified precedent: CLAUDE.md said the engine "applies the first match" — the code (`policyEngine.ts:115`) applies ALL matched rules by priority with a structural cap. Session 4 found the `.mjs` server "far more complete than the docs claimed." Always re-verify a doc claim before building on it.

## Recipe 1 — Premise teardown

When a plan rests on an assumption, name the assumption and attack it before spending on the plan.

**Worked example (session 8, 2026-07-03):** Premise: "the pilot tests our AI plan quality; the adaptation engine must be wired first." Teardown: (a) a plan is not a moat — ChatGPT generates one free; the differentiator is whether users COME BACK; (b) the engine's thresholds are unsourced, so automating them validates nothing. Result: pilot judged on the retention loop; engine deliberately NOT wired — founder does Wizard-of-Oz adaptation via the admin portal, and his manual interventions calibrate the thresholds automation would need anyway. One teardown deleted weeks of premature work.

**Second example (session 5):** Premise: "do behavioral research before shiping rules." Teardown via YC logic: research without usage data optimizes a product nobody may want. Decision: ship first, research as fast-follow (`.ai/behavioral-science-and-engine-alignment.md`).

Checklist: What must be true for this plan to pay off? · What's the cheapest observation that would falsify it? · Who is this actually for (founder persona vs. imagined user)?

## Recipe 2 — Build-vs-buy (here: usually "build small vs. adopt dependency")

This repo's revealed preference is **build-small with raw primitives** when the surface is small and testability matters: raw `fetch` over 3 AI SDKs (injectable fetch → 100% offline-testable chain), hand-rolled attempt-cap over an auth library, Nixpacks over Dockerfiles, `serve -s dist` over a CDN product, hash-route over react-router.

The test applied each time: (1) how many lines is the honest hand-rolled version? (2) does the dependency's failure mode land in a security- or determinism-critical path? (3) will it fight the strict-TS/ESM/node:test toolchain? Buy only when all three are safe. Counter-signal to watch: the 613-line `.mjs` server is where "build small" is nearing its ceiling (see architecture-contract §Known-weak points).

## Recipe 3 — Discriminating experiment

Design the cheapest probe whose outcome differs depending on which hypothesis is true. In this repo that is usually: an offline test with a fake seam, then ONE bounded live call.

**Worked example (session 5):** Hypothesis: "prompts + guard are aligned." Probe: `agentSpecConsistency.test.ts` — assert each agent's own `example_output.json` passes the guard. It failed for the professor: "Diagnose a basic network issue" was rejected. That single failing assertion discriminated between "prompt problem" and "guard too broad" — the guard's bare `/diagnos/` pattern was the defect. Fix: medical-collocation narrowing (gotcha #13). The test stays as a permanent drift tripwire.

**Worked example (session 4):** Hypothesis: "the provider configs are correct." Probe: `smoke:ai` per provider per tier — one bounded billable sweep. It surfaced 5 real quirks (gpt-5.x `max_completion_tokens`, temperature rejection, Gemini thinking-budget starvation, Anthropic alias 404s, Gemini pro latency) that no amount of doc-reading predicted. Lesson: for external APIs, one cheap live probe beats speculation — but keep it bounded and capped (billable-loop rule, runbook §Validation bar).

**The founder walkthrough is also an instrument** (session 7): a live walk exposed that the flow dead-ended after onboarding — unmeasurable retention — which reframed the whole build (Sprint Loop, B2). When a UX hypothesis matters, the discriminating experiment is "watch the founder use it," not more code reading.

## Recipe 4 — Root-cause (not first-cause)

Rule: reproduce → isolate the minimal failing element → explain the MECHANISM → only then fix. This repo's incidents all had non-obvious mechanisms one layer below the symptom:

| Symptom | First guess | Actual mechanism |
|---|---|---|
| All pilot tables missing on clean DB (gotcha #6) | "pilot migration didn't run" | It ran — `onboarding_drafts` FK'd a non-existent `users(id)`; single BEGIN/COMMIT rolled back the WHOLE file silently |
| Railway build can't find `tsc`/`vite` (gotcha #17) | "bad install" | `NODE_ENV=production` (needed for security guards) makes `npm install` skip devDependencies |
| Hero logo blank (session 7) | "missing asset" | `currentColor` inside an SVG `<pattern>` doesn't inherit from the referencing circle — color had to move to the `<svg>` root |
| Black page on overscroll (gotcha #2) | "component bg" | `html,body` were transparent; fix belonged in global `styles.css` |
| Gemini returns empty (gotcha #11) | "outage/bad key" | Thinking tokens consume `maxOutputTokens` BEFORE the answer; small budgets starve the reply |

Discipline: if your fix works but you can't state the mechanism, you haven't root-caused — you've suppressed a symptom (the dev_code leak, gotcha #14, was exactly a "helpful fallback" whose mechanism nobody had traced to "auth bypass").

## Interpreting pilot data (the next analysis frontier)

- Thresholds are only evidence if written BEFORE the data arrives (session-8 rule; still unwritten as of 2026-07-06 — first user blocks on it).
- n≈10 supports existence proofs ("at least one ambivalent user finished") and mechanism stories from exit text — not percentages. An ambivalent finisher is the strongest validation; a toll-payer dropout with an exit reason is data, not failure.
- The core retention datum is `pilot_sprint_days.completed_at`; the admin cohort view (`#admin`) is the founder's daily instrument.

## Provenance and maintenance

Written 2026-07-06 at commit `9d16f26`, from `.ai/backlog.md` sessions 4–8, `.ai/handoff.md`, and CLAUDE.md gotchas — all worked examples are recorded incidents, none invented. Re-verify:
- History still matches: `cat .ai/backlog.md` and CLAUDE.md §Active Gotchas.
- Drift tripwire still present: `ls backend/tests/agents/ai/agentSpecConsistency.test.ts` (verified 2026-07-06).
- Pilot thresholds written yet? Check `.ai/` for a thresholds doc; if absent and users exist, flag it.
