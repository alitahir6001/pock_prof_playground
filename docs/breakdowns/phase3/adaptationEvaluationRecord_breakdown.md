# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationEvaluationRecord.ts`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## Purpose
Builds a validated, persistence-ready adaptation evaluation record from policy engine output plus trigger/state context.

## Architecture mapping
- Data-shaping boundary between policy output and storage contract.
- Ensures consistent record schema regardless of storage backend.

## Block-by-block walkthrough
1. **Input contract**
   - Requires user id, evaluation timestamp, policy output, trigger window, and pre/post state.
2. **Input validation**
   - Enforces presence/object shape and valid ISO timestamp.
3. **Event extraction/normalization**
   - Flattens `events_used` across all mutations and deduplicates them.
4. **Record assembly**
   - Maps policy output fields into storage payload keys expected by persistence adapters.
   - Includes deferred mutations for full auditability.

## Failure modes
- Missing/invalid params -> explicit errors.
- malformed engine output object -> explicit error.

## Pilot risk level
**Medium-High**: malformed record assembly would silently corrupt audit quality.

## Suggested refactor
- Add strict runtime schema validation for assembled record before persistence call.
