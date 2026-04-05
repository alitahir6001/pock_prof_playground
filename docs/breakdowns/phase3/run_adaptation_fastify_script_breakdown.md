# File Breakdown: `backend/scripts/run_adaptation_fastify.mjs`

## Layman translation
### Here's what it means in plain terms
- This script starts the HTTP adaptation service so clients can send evaluation requests.

### Why it's built
- It provides a local/runtime shell around the core adaptation engine with health checks and error handling.

### How it helps a service worker switch careers
- It enables reliable request/response behavior so plan updates are delivered consistently, not randomly failing.

## What this file does
- Boots a Fastify server with configurable host/port and persistence mode (`file` or `postgres`).
  - **In plain English:** lets developers run adaptation locally or against a database.
- Validates critical env config (e.g., database URL when in postgres mode).
  - **In plain English:** fails early instead of crashing mid-request.
- Exposes `/adaptation/health` and `/adaptation/evaluate` endpoints.
  - **In plain English:** one endpoint checks service health, the other runs adaptation.
- Applies defensive request/error hooks and structured logs with diagnostic codes.
  - **In plain English:** bad requests are handled predictably and easier to debug.
- Closes Postgres pool on shutdown.
  - **In plain English:** cleans up connections so runtime exits safely.
