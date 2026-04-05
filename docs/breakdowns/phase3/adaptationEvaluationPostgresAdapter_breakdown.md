# File Breakdown: `backend/src/modules/adaptation/phase3/adaptationEvaluationPostgresAdapter.ts`

## Purpose
Implements Postgres-backed transaction and repository adapters for adaptation evaluation persistence.

## Architecture mapping
- Production-grade persistence path behind shared persistence contract.
- DB transaction lifecycle owned here, business fail-closed logic remains in contract helper.

## Block-by-block walkthrough
1. **Pool/client interfaces**
   - Minimal `PostgresClientLike`/`PostgresPoolLike` interfaces keep adapter testable.
2. **Transaction implementation**
   - `commit` => `COMMIT` + `release`.
   - `rollback` => `ROLLBACK` + `release`.
   - Finalization guard prevents double-finalize.
3. **Transaction factory**
   - `begin` opens pooled client and executes `BEGIN`.
4. **Repository insert path**
   - Validates tx type.
   - Generates deterministic id prefix (`eval_...`).
   - Executes parameterized `INSERT ... RETURNING evaluation_id`.
   - Falls back to generated id if db row is unexpectedly missing.
5. **Adapter constructor**
   - `createPostgresPersistenceAdapter` returns txFactory/repository pair.

## Failure modes
- Wrong tx type -> explicit error.
- SQL/query failures -> propagated for higher-level handling.

## Pilot risk level
**High**: directly governs durable audit writes in production mode.

## Suggested refactor
- Wrap db errors into typed persistence errors for richer diagnostics.
