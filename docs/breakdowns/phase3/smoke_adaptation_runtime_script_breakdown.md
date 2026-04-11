# File Breakdown: `backend/scripts/smoke_adaptation_runtime.sh`

## Layman translation
### Here's what it means in plain terms
- This smoke script probes the HTTP runtime with success and failure requests.

### Why it's built
- It provides a quick operational confidence check for runtime behavior and error determinism.

### How it helps a service worker switch careers
- It reduces runtime surprises that could interrupt plan recommendations for active learners.

## What this file does
- Checks `/adaptation/health` expecting HTTP 200.
  - **In plain English:** confirms service is up.
- Sends valid payload expecting HTTP 200.
  - **In plain English:** verifies normal adaptation flow works.
- Sends malformed payload expecting HTTP 400 + `BAD_REQUEST`.
  - **In plain English:** verifies bad input is rejected cleanly.
- Sends Content-Type header bypass probe expecting 400.
  - **In plain English:** tests a basic request-hardening path.
- Sends oversized payload expecting deterministic 4xx (not 500).
  - **In plain English:** ensures overload fails predictably, not catastrophically.
