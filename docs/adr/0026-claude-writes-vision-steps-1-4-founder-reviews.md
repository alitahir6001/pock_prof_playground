---
status: accepted
date: 2026-11-14
---
# Claude writes vision steps 1–4; the founder reviews

## Context and Problem Statement
ADR-0022 has the founder type the ownership-ladder changes while Claude explains and reviews. ADR-0025 puts four build steps ahead of the n=3 test. The question was who writes them.

## Considered Options
* The founder types steps 1–4 (extend ADR-0022)
* Claude writes steps 1–4; the founder reviews

## Decision Outcome
Chosen option: "Claude writes steps 1–4; the founder reviews", because the steps are a prerequisite for the test, not ownership exercises. Claude builds one step at a time, verifies it against its "done when" line, explains it in plain terms, and stops for review before the next. ADR-0022 still governs the ownership-ladder changes: the founder types those.

### Consequences
* Good, because the test starts sooner.
* Bad, because the founder did not type the memory and outreach code; the per-step explanation and review are the only mitigation.

## More Information
Evidence: 5f0c6a6, `.ai/handoff.md` "Open threads" (Ownership). Amends [ADR-0022](0022-founder-types-claude-reviews-ownership-ladder.md).
