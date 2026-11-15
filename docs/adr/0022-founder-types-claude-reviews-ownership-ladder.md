---
status: accepted
date: 2026-08-13
---
# Code-ownership ladder: the founder types; Claude explains and reviews

## Context and Problem Statement
A set of small real changes (onboarding copy, Professor tone, removing the dead draft call, an admin-cohort column, sprint length) was planned as a way for the founder to own the codebase end to end (`.ai/handoff.md:34`). The question was who writes those changes.

## Considered Options
* Claude writes the code (the previous default)
* The founder types; Claude explains and reviews

## Decision Outcome
Chosen option: "The founder types; Claude explains and reviews", as a working agreement for the ownership-ladder changes (c80adb9, `.ai/handoff.md:27`). Claude does not write those changes.

### Consequences
* Good, because the founder builds a working model of each part touched.
* Bad, because those changes land slower than if Claude wrote them.

## More Information
Evidence: c80adb9, `.ai/handoff.md:27`, `:34`, `.ai/history.md` (session 10). Amended by [ADR-0026](0026-claude-writes-vision-steps-1-4-founder-reviews.md): Claude writes vision steps 1–4.
