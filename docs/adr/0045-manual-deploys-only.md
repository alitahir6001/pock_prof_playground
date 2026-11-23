---
status: accepted
date: 2026-11-14
---
# Deploy by hand only; pushes to GitHub never touch the live app

## Context and Problem Statement
The pilot went live on a new Railway project on 2026-11-14 with both services auto-deploying from GitHub `main` (`c4881d1:.ai/handoff.md:7`). The n=3 test needs prod frozen for 14 days (`.ai/handoff.md:19`, `:44`). The question was whether a push should keep reaching the live app.

## Considered Options
* Auto-deploy from GitHub `main` (the setup at first deploy)
* Repo-linked services with the GitHub push triggers removed; deploy a chosen commit by hand

## Decision Outcome
Chosen option: "Repo-linked services with the GitHub push triggers removed; deploy a chosen commit by hand", "so pushes never touch the live app" (51b18f5). A deploy is one Railway API call naming the service, environment and commit SHA (`.ai/handoff.md:26`).

### Consequences
* Good, because commits can land on `main` during the test without changing what testers see.
* Bad, because every deploy is a manual step. The commit must be pushed first, since Railway builds from GitHub, and the backend goes before the frontend when the frontend calls new routes (`.ai/handoff.md:26`).
* Bad, because what runs in prod can drift from `main`, so the deployed SHA per service has to be recorded (`.ai/handoff.md:7`).

## More Information
Evidence: 51b18f5, `c4881d1:.ai/handoff.md:7`, `.ai/handoff.md:7`, `:19`, `:26`, `:44`. Related: [ADR-0011](0011-host-on-railway-with-nixpacks.md), [ADR-0024](0024-db-access-via-railway-ssh-tunnel.md), [ADR-0025](0025-n3-test-runs-on-vision-steps-1-4.md).
