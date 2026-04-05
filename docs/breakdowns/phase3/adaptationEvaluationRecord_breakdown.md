# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationEvaluationRecord.ts`

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
