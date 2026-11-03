---
status: accepted
date: 2026-03-03
---
# Three advisory-only agents with strict JSON contracts enforced by an output guard

## Context and Problem Statement
The product needs AI for onboarding direction, daily lessons, and coaching. Downstream code must consume agent output safely, and agents must not change user state directly.

## Considered Options
* Three agents (Onboarding, Professor, Career Coach), each with its own contract
* One merged agent (rejected in `docs/understanding/agent-layer.md`, "Why three separate agents instead of one?")
* Free-form text output (rejected in `docs/understanding/agent-layer.md`, "Why strict JSON output schemas?")

## Decision Outcome
Chosen option: "Three agents with strict JSON contracts", because each role has a different register, and only schema-validated output can be consumed safely. Agents are advisory only; the policy engine decides (`docs/system_invariants_v1.md` §3.3, §6). Agent bundles first appear in 03c8c08; `agentOutputGuard.ts` (schema validation plus prohibited-content filter) first appears in bd93df2. Contract details: `docs/phase2_agent_system_design.md`.

### Consequences
* Good, because malformed or prohibited output is rejected before use (`CLAUDE.md:181`).
* Bad, because the prompt must carry the exact schema; instructions alone do not produce guard-passing output (`CLAUDE.md` gotcha 12).

## More Information
Evidence: 03c8c08, bd93df2, `CLAUDE.md:181`, gotcha 12, `docs/system_invariants_v1.md` §3.3, §6, `docs/phase2_agent_system_design.md`, `docs/understanding/agent-layer.md`. Related: [ADR-0009](0009-multi-provider-ai-fallback-via-raw-fetch.md).
