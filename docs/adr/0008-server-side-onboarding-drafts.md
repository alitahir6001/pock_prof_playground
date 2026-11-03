---
status: superseded by ADR-0012
date: 2026-05-06
---
# Persist onboarding drafts server-side in `onboarding_drafts`

## Context and Problem Statement
The new multi-step onboarding flow (9639850) needed to keep a user's partial answers between visits.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: "An `onboarding_drafts` table in the pilot migration" (0614f6d). The reason is not recorded.

### Consequences
* Bad, because the table referenced a nonexistent `users(id)` table and, inside the single migration transaction, rolled back all pilot tables on a clean database (`CLAUDE.md` gotcha 6).

## More Information
Evidence: 0614f6d, gotcha 6. Superseded by [ADR-0012](0012-onboarding-drafts-in-localstorage-only.md).
