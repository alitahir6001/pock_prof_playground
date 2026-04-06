# File Breakdown: `backend/package.json`

## Layman translation
### Here's what it means in plain terms
- This file defines how to build, test, run, migrate, and smoke-test the backend adaptation slice.

### Why it's built
- It centralizes runnable commands and dependency versions for consistent local/CI behavior.

### How it helps a service worker switch careers
- Reliable automation around build/test/run reduces regressions that would disrupt learner experience.

## What this file does
- Declares project metadata and ESM mode.
  - **In plain English:** sets runtime expectations for Node.
- Defines scripts for build/test, runtime startup, worker/broker runs, smoke checks, and DB migrations.
  - **In plain English:** one command surface for engineers/operators.
- Pins core dependencies (`fastify`, `pg`) and dev dependency (`typescript`).
  - **In plain English:** standardizes toolchain and runtime libraries.
