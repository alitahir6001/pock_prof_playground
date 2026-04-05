# Pocket Professor

Pocket Professor is a structured learning platform for career-switchers.  
The system is designed around deterministic adaptation, strict agent contracts, and auditable decision-making so learning plans can evolve safely over time.

## What this repository currently contains

- **Phase 2 agent contracts** (schema + instructions + examples) for:
  - onboarding agent
  - professor agent
  - career coach agent
- **Phase 3 adaptation engine slices**:
  - deterministic policy evaluation
  - audit record payload builder
  - transactional persistence wiring with fail-closed behavior for structural mutations
  - agent output guard for schema/policy rejection paths
- **Architecture and phase docs** under `docs/`
- **Code breakdown planning guide** in `docs/code_breakdown_plan.md`
- **Adaptation troubleshooting runbook** in `backend/docs/adaptation_troubleshooting_guide.md`
- **Prototype assets** under `prototype/` (legacy exploratory implementation)

## Repository layout

```text
pocket_professor/
├── backend/
│   ├── src/modules/adaptation/phase3/
│   ├── src/modules/agents/phase2/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── docs/
├── learning/
├── prototype/
└── readme.md
```

---

## Prerequisites

Install these before local setup:

- **Git**
- **Node.js 20+** (recommended LTS)
- **npm 10+**

Verify versions:

```bash
node -v
npm -v
git --version
```

---

## Quick start (backend phase slices)

From repository root:

```bash
cd backend
npm install
npm run test:phase3
```

What this does:

1. Installs local dev dependencies (including TypeScript).
2. Compiles the slice with `tsc -p tsconfig.json`.
3. Runs Node test suites in `dist/tests/...`.

---

## Important scripts

Run inside `backend/`:

- `npm run build:phase3` — compile TypeScript for phase slices.
- `npm run test:phase3` — compile + run current slice tests.
- `npm run db:migrate:adaptation:up` — apply `adaptation_evaluations` schema migration (requires `ADAPTATION_DATABASE_URL`).
- `npm run db:migrate:adaptation:down` — roll back `adaptation_evaluations` schema migration.
- `npm run start:adaptation-worker` — run queue-style worker runtime script for one worker job payload.
- `npm run smoke:adaptation-worker` — run deterministic worker smoke checks.
- `npm run start:adaptation-broker-worker` — process a broker-style queue batch (file-queue transport).
- `npm run smoke:adaptation-broker-worker` — run broker worker smoke checks + telemetry output.

Worker runtime envs (queue-style wrapper):
- `ADAPTATION_WORKER_JOB_JSON` (required worker envelope including `message_id`, `attempt`, `max_attempts`, `job_id`, `payload`)
- `ADAPTATION_WORKER_MAX_ATTEMPTS` (optional, default `3`)
- `ADAPTATION_WORKER_IDEMPOTENCY_FILE` (optional, default `./data/adaptation-worker-idempotency.json`)

---

## Environment setup notes

Current committed phase slices do **not** require API keys to run unit tests.

As runtime services are added in later slices (API/worker integration, DB adapters, LLM calls), use a local `.env` file (not committed) and document new variables in this README under an "Environment Variables" section.

---

## Development workflow

Recommended flow for contributors:

1. Create a feature branch from latest `main`.
2. Make changes in scoped slice increments.
3. Run `npm run test:phase3` from `backend/`.
4. Keep docs in `docs/` in sync with implementation changes.
5. Open PR with:
   - motivation
   - scope
   - deterministic/fail-closed implications
   - test evidence

---

## Troubleshooting

Primary troubleshooting guide:
- `backend/docs/adaptation_troubleshooting_guide.md`

### `tsc is not recognized as an internal or external command`

Cause: TypeScript is not installed locally in `backend/node_modules`.

Fix:

```bash
cd backend
npm install
npm run build:phase3
```

`typescript` is included as a backend dev dependency, so `npm install` should make `tsc` available to npm scripts.

### Tests compile but fail at runtime

Run a clean build:

```bash
cd backend
rm -rf dist
npm run test:phase3
```

---



## Database migration runbook (adaptation_evaluations)

Migration files:
- `backend/db/migrations/20260325_001_create_adaptation_evaluations.up.sql`
- `backend/db/migrations/20260325_001_create_adaptation_evaluations.down.sql`

Operational guide:
- `backend/docs/adaptation_evaluations_migration_runbook.md`

Apply migration:
```bash
cd backend
export ADAPTATION_DATABASE_URL='postgres://<user>:<pass>@<host>:5432/<db>'
npm run db:migrate:adaptation:up
```

Rollback migration:
```bash
cd backend
export ADAPTATION_DATABASE_URL='postgres://<user>:<pass>@<host>:5432/<db>'
npm run db:migrate:adaptation:down
```

## Tiny runtime wrapper (Fastify)

To run a local adaptation route using Fastify:

```bash
cd backend
npm install
npm run start:adaptation-runtime
```

Then in a second terminal run the smoke script:

```bash
cd backend
npm run smoke:adaptation-runtime
```

The smoke script checks:
- health endpoint (`GET /adaptation/health` -> `200`)
- happy path (`200`)
- malformed payload failure (`400` with `BAD_REQUEST`)
- tab Content-Type probe failure (`400` with `BAD_REQUEST`)
- oversized payload failure (`4xx`, never silent `500`)

This confirms deterministic success and deterministic failure behavior at the transport boundary.

---

## Current status

- ✅ Deterministic policy engine and rule ordering in place.
- ✅ Structural mutation cap + deferral behavior implemented.
- ✅ Fail-closed audit persistence semantics for structural mutations implemented.
- ✅ Agent output guard + rejection reason paths covered by tests.
- ⏳ Remaining gap: production queue transport integration + observability hardening before micro-pilot.

---

## License

No license file is currently included in this repository.
If you plan to open-source publicly, add a `LICENSE` file and update this section.
