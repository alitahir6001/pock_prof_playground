---
status: accepted
date: 2026-11-16
---
# Browser security headers come from the static host's `serve.json`; its CSP names the backend

## Context and Problem Statement
The frontend is static files served by `serve` on Railway ([ADR-0011](0011-host-on-railway-with-nixpacks.md)). The 2026-11-16 security pass added browser-side protections and needed somewhere to set them (c30d0fd; gotcha 23).

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: "Set the headers in `frontend/public/serve.json`": a Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a referrer policy and HSTS (c30d0fd). The CSP's `connect-src` allows only the page's own origin and the backend URL (`frontend/public/serve.json`; gotcha 23c). The reason for this placement is not recorded.

### Consequences
* Good, because the headers ship with the frontend build, with no proxy in front of the static host.
* Bad, because changing the backend domain means updating `connect-src` too, or every API call is blocked (gotcha 23c, `.ai/handoff.md:31`).
* Bad, because `npm run dev` ignores the file, so the headers only apply under `npm run start`, and a local `start` against a local backend is blocked by design (gotcha 23c).

## More Information
Evidence: c30d0fd, `frontend/public/serve.json`, gotcha 23c, `.ai/handoff.md:31`. Related: [ADR-0011](0011-host-on-railway-with-nixpacks.md), [ADR-0023](0023-pilot-address-learn-pakfro-dev.md), [ADR-0043](0043-production-guards-keyed-on-node-env.md).
