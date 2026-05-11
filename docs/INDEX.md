# docs/INDEX.md

Navigation guide for the Pocket Professor knowledge base.
Maintained by the coding agent. Do not edit manually — update after adding or changing docs.

---

## How to use this index

Read `CLAUDE.md` (project root) and `.ai/handoff.md` first — they tell you current state.
Come here when you need to go deeper on a specific topic. Read only what your task requires.

---

## Start here (new to the project)

| File | What it covers | Read when |
|---|---|---|
| `project_onboarding_and_phase_guide.md` | All 6 phases, local setup, validation checklists, active conflicts | Starting fresh or setting up local dev |
| `system_invariants_v1.md` | Hard architectural constraints: determinism, mutation caps, event immutability, audit requirements | Before touching persistence, adaptation, or agent layers |
| `behavioral_design_v1.md` | 11 behavioral principles that drive adaptation rules and UI defaults (implementation intentions, micro-proof momentum, recovery over perfection, etc.) | Before touching any adaptation rule or agent behavior |

---

## Architecture references

| File | What it covers | Read when |
|---|---|---|
| `phase1_system_architecture_plan.md` | Full system design: DB schema, event model, adaptation engine structure, agent orchestration, API boundaries | Implementing any backend service or understanding component relationships |
| `phase2_agent_system_design.md` | Agent contract layer: soul files, system instructions, strict JSON output schemas, example payloads for all 3 agents | Integrating or extending agents; validating agent output |
| `phase3_adaptation_engine_build_slice.md` | Phase 3 implementation: rule evaluator, transactional persistence, file/Postgres adapters, API/worker entrypoints | Working on adaptation evaluation or persistence |
| `phase3_broker_telemetry_slice.md` | Broker worker batch processor, telemetry aggregation, runtime wrappers | Working on queue integration or observability |

---

## Operational guides

| File | What it covers | Read when |
|---|---|---|
| `railway_pilot_deploy_guide.md` | Railway deployment checklist: email auth, Postgres, pilot wizard, env var setup | Deploying or configuring a production/pilot environment |
| `backend/docs/adaptation_troubleshooting_guide.md` | Common runtime failures (HTTP 400/503, worker failures, Postgres errors) mapped to diagnostic codes and fixes | Debugging adaptation engine in any environment |
| `backend/docs/adaptation_evaluations_migration_runbook.md` | Step-by-step apply/rollback for the `adaptation_evaluations` Postgres schema | Running or rolling back DB migrations |

---

## Meta / documentation tooling

| File | What it covers | Read when |
|---|---|---|
| `summary_docs_master_list.md` | Directory of all docs organized by phase and type, with completion status | Navigating the full doc hierarchy |
| `code_breakdown_plan.md` | Strategy for breaking code into documented chunks (walk order, format) | Tasked with documenting new code |
| `master_file_breakdown_checklist.md` | Tracks which backend files have been documented | Checking documentation coverage |

---

## docs/understanding/ — Mental models + guided reading

Plain-English explanations of each major subsystem. Written for someone who designed the system but doesn't read TypeScript daily. Each doc includes a reading guide (files in order) so you know exactly where to look to go deeper.

| File | Subsystem |
|---|---|
| `understanding/adaptation-engine.md` | How the deterministic rule evaluator works, the 5 rules, fail-closed mutations, persistence modes |
| `understanding/agent-layer.md` | The 3 agents, their contracts, output guard, and what changes when real AI is wired in |
| `understanding/auth-sessions.md` | Email magic-code login, session token lifecycle, local dev fallback behavior |
| `understanding/data-model.md` | Every table, what it stores, what's intentionally not stored, migration gotchas |

---

_Breakdowns directory was deleted (2026-05-09). It contained granular file-by-file notes for Phase 1–3 code — all derivative, no new architectural decisions. Replaced by `docs/understanding/` which covers the same ground at a more useful level of abstraction._
