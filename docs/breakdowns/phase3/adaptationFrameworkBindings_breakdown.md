# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationFrameworkBindings.ts`

## Purpose
Maps generic adaptation entrypoints to HTTP-like and worker-like runtime contracts with deterministic status/error shapes.

## Architecture mapping
- Thin framework binding layer separating transport concerns from business orchestration.
- Normalizes operational outputs for routing, retries, and observability.

## Block-by-block walkthrough
1. **Dependency and request/response types**
   - Framework dependency bundle mirrors entrypoint dependencies.
2. **HTTP route binding**
   - Calls API entrypoint.
   - Maps success to `200` payload.
   - Maps audit persistence fail-closed to `503` payload.
   - Maps all thrown validation/config errors to `400 BAD_REQUEST` with diagnostic code.
3. **Worker message binding**
   - Calls worker entrypoint.
   - Returns `completed` payload on success.
   - Returns `failed` payload with `error_code` + `diagnostic_code` on any exception.

## Failure modes
- Non-entrypoint runtime exceptions are captured and normalized instead of leaking stack-specific behavior.

## Pilot risk level
**Medium-High**: wrong mapping can create retry storms or poor client UX.

## Suggested refactor
- Introduce centralized error-code map shared across HTTP and worker handlers.
