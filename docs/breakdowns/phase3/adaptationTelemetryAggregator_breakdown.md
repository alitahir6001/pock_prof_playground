# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationTelemetryAggregator.ts`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## Purpose
Minimal in-memory metric counter utility used by broker processing to aggregate batch telemetry.

## Architecture mapping
- Lightweight observability primitive for runtime scripts/tests before external metrics backend integration.

## Block-by-block walkthrough
1. **Telemetry snapshot type**
   - Plain key/value numeric metric map.
2. **Aggregator class**
   - `increment` mutates per-metric counters.
   - `snapshot` exports current counters as serializable object.

## Failure modes
- In-memory only; state is process-local and reset on restart.

## Pilot risk level
**Low-Medium**: simple but visibility-critical during runtime debugging.

## Suggested refactor
- Add `merge` and optional immutable snapshots for concurrent aggregation paths.
