---
status: accepted
date: 2026-04-11
---
# v2 frontend: React and Vite in plain JSX, Tailwind v4, mobile-first

## Context and Problem Statement
v1's frontend was a single plain HTML/CSS/JS page with no framework (`9725c1e^:readme.md:80`, `prototype/frontend/demo_frontend.html`). The Phase 1 plan specified a React + TypeScript frontend with `App.tsx` (`docs/phase1_system_architecture_plan.md:174-180`). The pilot needed a real UI for login and onboarding.

## Considered Options
* React + TypeScript (the Phase 1 plan)
* React + Vite in plain JSX

## Decision Outcome
Chosen option: "React + Vite in plain JSX". The first v2 frontend landed with the email-login pilot as Vite + React in `.jsx` files (6fb57d1: `frontend/vite.config.js`, `frontend/src/App.jsx`). The onboarding flow came from a Claude design (9639850), with Tailwind v4 design tokens (7852f89, `frontend/src/onboarding/tokens.css`). The shell is mobile-first at `max-w-[440px]` (`CLAUDE.md:142`), and the stack is React 18 and Vite 5, JSX, no TypeScript (`CLAUDE.md:156`). Why JSX was chosen over the planned TypeScript is not recorded.

### Consequences
* Good, because the build output is static files, served with `serve` and no server-side rendering ([ADR-0011](0011-host-on-railway-with-nixpacks.md)).
* Bad, because the frontend is not type-checked against the backend's TypeScript contracts (inferred from `CLAUDE.md:156`).

## More Information
Evidence: `9725c1e^:readme.md:80`, `docs/phase1_system_architecture_plan.md:174-180`, 6fb57d1, 9639850, 7852f89, `CLAUDE.md:142`, `:156`. v1's demo page was deleted in 08602c6. Related: [ADR-0011](0011-host-on-railway-with-nixpacks.md), [ADR-0032](0032-v2-stack-node-typescript-fastify-postgres.md).
