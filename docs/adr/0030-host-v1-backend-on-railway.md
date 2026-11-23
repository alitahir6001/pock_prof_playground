---
status: superseded by ADR-0011
date: 2025-07-14
---
# Host the v1 FastAPI backend on Railway; serve the demo page from the personal site

## Context and Problem Statement
The v1 web prototype ([ADR-0001](0001-prototype-local-llm-ollama-behind-fastapi.md)) ran its backend locally, and its demo page fetched `http://localhost:8000/generate-curriculum` (6955414). On 2025-07-14 the model moved to the hosted Gemini API ([ADR-0002](0002-hosted-gemini-api-over-local-ollama.md), 17c6f04), so the backend could run anywhere with an API key. It needed a public host.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: "Railway for the FastAPI backend, the demo page on the personal site". The demo page's fetch URL moved from localhost to a `*.up.railway.app` backend on 2025-07-14 (6955414; the same change in the personal site repo `alitahir6001.github.io`, b6d5931). The README lists Railway as the deployment target and records "The FastAPI backend is deployed and running on Railway" (`9725c1e^:readme.md:82`, `:146`). The demo page was served from the personal site repo (2ec1788, 2025-06-24), and the backend's CORS allowed only `pakfro.dev`, its subdomains and localhost (c3279cc, b96023b). The work landed on the branch `v0.04_techCrunch_demo` (PR #12, fed8829); that a TechCrunch demo set the timing is inferred from the branch name. Why Railway was chosen is not recorded.

### Consequences
* Good, because the demo worked from a public page while the only secret, `GEMINI_API_KEY`, stayed on the server (17c6f04).
* Bad, because the public backend had no rate limit until 2025-08-17 (9aa6a5b, 731d8fb).

## More Information
Evidence: 6955414, 17c6f04, c3279cc, b96023b, fed8829, 9aa6a5b, 731d8fb, `9725c1e^:readme.md:82`, `:146`; personal site repo 2ec1788, b6d5931. The v1 backend URL names a `pocket-professor-backend` service; a Railway project of that name was deleted on 2026-11-14 when the pilot moved to a fresh project (`51b18f5:.ai/handoff.md`, "Live deploy reference"; [ADR-0024](0024-db-access-via-railway-ssh-tunnel.md)). That it was the v1 project is inferred from the name. Superseded by [ADR-0011](0011-host-on-railway-with-nixpacks.md), which hosts v2 on Railway.
