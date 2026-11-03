---
status: accepted
date: 2026-06-13
---
# Keep onboarding drafts in localStorage only; drop the database table

## Context and Problem Statement
The `onboarding_drafts` table from [ADR-0008](0008-server-side-onboarding-drafts.md) had a foreign key to a nonexistent `users(id)` table and broke the whole pilot migration on a clean database (`CLAUDE.md` gotcha 6).

## Considered Options
* Keep database persistence (ADR-0008)
* Reintroduce the table later with its FK pointed at `pilot_users(user_id)` (gotcha 6, left open for after the pilot)
* localStorage only

## Decision Outcome
Chosen option: "localStorage only" (key `pp_onboarding_draft_v2`, `frontend/src/onboarding/useOnboardingDraft.js:14`), with the table removed from the migration (1f3fa0b) and the frontend persistence path removed (e6d4465, 2220382). See `docs/what-is-pocket-professor.md:114`.

### Consequences
* Good, because the pilot migration applies cleanly.
* Bad, because a draft does not follow the user across devices (inferred from browser-only storage).
* Bad, because the frontend still calls `/pilot/onboarding/draft`, which has no server route (gotcha 6).

## More Information
Evidence: e6d4465, 1f3fa0b, 2220382, gotcha 6, `docs/what-is-pocket-professor.md:114`. Supersedes [ADR-0008](0008-server-side-onboarding-drafts.md).
