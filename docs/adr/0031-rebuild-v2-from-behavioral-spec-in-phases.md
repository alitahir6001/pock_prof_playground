---
status: accepted
date: 2026-02-22
---
# Rebuild as v2 from a written behavioral spec, phase by phase, before user contact

## Context and Problem Statement
By late 2025, v1 was a hosted syllabus generator ([ADR-0002](0002-hosted-gemini-api-over-local-ollama.md), [ADR-0030](0030-host-v1-backend-on-railway.md)). Its README roadmap aimed at an adaptive engine: a gap-analysis agent loop, a Study, Test, Feedback UI, Firestore logging of quiz interactions, then alpha testing with career-switchers (`9725c1e^:readme.md:155-161`). The question was whether to extend v1 along that roadmap or start again from a written design.

## Considered Options
* Extend v1 along its README roadmap (the prior plan)
* Rebuild from a behavioral spec, phase by phase

## Decision Outcome
Chosen option: "Rebuild from a behavioral spec, phase by phase". On 2026-02-22 the behavioral design doc landed (7ce7b28, `docs/behavioral_design_v1.md`), followed the same day by a Phase 1 architecture plan that treats those principles as "fixed and unmodified" (fa3f780, 9faefe4, d1bcc89; `docs/phase1_system_architecture_plan.md:3-4`). They were merged as PR #18 from a `codex/` branch (f532135). The phases run from behavioral research through architecture, agent contracts and the engine, then curriculum graph, market-gap intelligence and freemium gating (`CLAUDE.md:77-85`). The v1 Python code (`learning/`, `prototype/`) was deleted on 2026-04-05 (08602c6). Why the project was rebuilt rather than extended is not recorded.

### Consequences
* Good, because the invariants were written before the code that enforces them (`docs/system_invariants_v1.md`; [ADR-0003](0003-deterministic-rule-engine-for-adaptation.md), [ADR-0004](0004-fail-closed-structural-mutations-and-append-only-evaluations.md)).
* Bad, because Phases 0 to 3 were built before any user contact. The 2026-07-12 evaluation called this "backwards sequencing" (`.ai/history.md:17`), and the Phase 3 engine is not in the live path (gotcha 18, [ADR-0018](0018-do-not-wire-adaptation-engine-for-pilot.md)).

## More Information
Evidence: 7ce7b28, fa3f780, 9faefe4, d1bcc89, f532135, 08602c6, `9725c1e^:readme.md:155-161`, `docs/phase1_system_architecture_plan.md:3-4`, `CLAUDE.md:77-85`, `.ai/history.md:17`. Supersedes [ADR-0029](0029-syllabus-generator-over-knowledge-base-qa-cli.md). Related: [ADR-0032](0032-v2-stack-node-typescript-fastify-postgres.md) (the stack), [ADR-0013](0013-ship-pilot-first-research-as-fast-follow.md), [ADR-0018](0018-do-not-wire-adaptation-engine-for-pilot.md).
