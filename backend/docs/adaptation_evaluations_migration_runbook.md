# Adaptation Evaluations Migration Runbook

This runbook defines how to apply and roll back the `adaptation_evaluations` schema used by the Phase 3 Postgres persistence path.

## Scope
- Migration up file: `backend/db/migrations/20260325_001_create_adaptation_evaluations.up.sql`
- Migration down file: `backend/db/migrations/20260325_001_create_adaptation_evaluations.down.sql`

## Preconditions
1. PostgreSQL connection URL is available in `ADAPTATION_DATABASE_URL` (or `DATABASE_URL`).
2. Target DB user has permissions to create tables and indexes.
3. A backup/snapshot policy exists for production environments.

## Apply migration (up)

```bash
export ADAPTATION_DATABASE_URL='postgres://<user>:<pass>@<host>:5432/<db>'
psql "$ADAPTATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/migrations/20260325_001_create_adaptation_evaluations.up.sql
```

### Verify apply

```bash
psql "$ADAPTATION_DATABASE_URL" -c "\d+ adaptation_evaluations"
psql "$ADAPTATION_DATABASE_URL" -c "SELECT indexname FROM pg_indexes WHERE tablename='adaptation_evaluations' ORDER BY indexname;"
```

Expected result:
- `adaptation_evaluations` table exists.
- Primary key on `evaluation_id` exists.
- `idx_adaptation_evaluations_user_time` and `idx_adaptation_evaluations_created_at` indexes exist.

## Rollback migration (down)

```bash
export ADAPTATION_DATABASE_URL='postgres://<user>:<pass>@<host>:5432/<db>'
psql "$ADAPTATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/migrations/20260325_001_create_adaptation_evaluations.down.sql
```

### Verify rollback

```bash
psql "$ADAPTATION_DATABASE_URL" -c "\dt adaptation_evaluations"
```

Expected result:
- No table named `adaptation_evaluations` is returned.

## Runtime usage after apply
To run Fastify adaptation runtime with Postgres persistence:

```bash
export ADAPTATION_PERSISTENCE_MODE=postgres
export ADAPTATION_DATABASE_URL='postgres://<user>:<pass>@<host>:5432/<db>'
cd backend
npm run start:adaptation-runtime
```

## Failure handling notes
- Migration files are transaction-wrapped (`BEGIN`/`COMMIT`) so partial schema writes are avoided on SQL errors.
- If migration apply fails, fix SQL/permissions, then re-run the `up` migration.
- If deployment requires rollback, run the `down` migration and restart runtime in file mode until DB path is restored.
