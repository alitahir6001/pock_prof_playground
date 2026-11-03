---
status: accepted
date: 2026-07-03
---
# Serve the pilot on a subdomain of the public site via CNAME, not a `/pilot` path

## Context and Problem Statement
The Railway-hosted pilot ([ADR-0011](0011-host-on-railway-with-nixpacks.md)) needed a public address under the project's existing domain.

## Considered Options
* A subdomain pointed at Railway by CNAME
* A `/pilot` path on the existing site (rejected: it would need reverse-proxying, 9d16f26)

## Decision Outcome
Chosen option: "Subdomain via CNAME", because a path would need a reverse proxy, and sharing the domain with the email sender helps deliverability and trust (9d16f26, `.ai/handoff.md` at that commit). Not yet executed: the CNAME is still an open pre-launch item (`.ai/handoff.md:32`).

### Consequences
* Good, because no proxy layer is needed in front of Railway.
* Bad, because DNS setup is an extra manual pre-launch step.

## More Information
Evidence: 9d16f26, `.ai/handoff.md:32`, `.ai/history.md` (session 8).
