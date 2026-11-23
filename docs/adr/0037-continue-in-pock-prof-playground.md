---
status: accepted
date: 2026-04-12
---
# Continue development in the clone `pock_prof_playground`; freeze `pocket_professor`

## Context and Problem Statement
All work up to 2026-04-12 was in `alitahir6001/pocket_professor`. On 2026-04-12 this repository was created as a clone of it. Its GitHub description is "a clone of the original to try out features" (`gh repo view alitahir6001/pock_prof_playground`). The question, as the record now shows it, was which repository carries the project.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: "Make the clone the working repository". Its history includes `pocket_professor`'s `main` up to d9805da (2026-04-12), and every commit since then is here only. `pocket_professor` was last pushed on 2026-04-17 (`gh repo view`) and holds two commits not in this repo: 662a1eb (2025-07-25, a user-research page) and f57d019 (2026-04-17, unmerged, "Improve pilot onboarding UX and relax agent guard rigidity"). Railway deploys from this repo (`.ai/handoff.md:26`). Neither the reason nor the date the clone became the main line is recorded.

### Consequences
* Good, because the v1 and early v2 history is all here, so older decisions can be cited from one repository ([ADR-0001](0001-prototype-local-llm-ollama-behind-fastapi.md), [ADR-0029](0029-syllabus-generator-over-knowledge-base-qa-cli.md)).
* Bad, because the two repositories diverge. f57d019 adds a migration numbered 003 (`20260417_003_auth_hardening`), while this repo's 003 is the sprint tables (`20260413_003_create_sprint_tables`). Its guard change was never merged here; this repo narrowed the guard separately (gotcha 13).
* Bad, because the name and GitHub description still say "playground" and "try out features", though this is the production source (GitHub metadata, read 2026-11-22).

## More Information
Evidence: `gh repo view` for both repositories (creation and last-push dates, description); d9805da; `gh api repos/alitahir6001/pocket_professor/compare/main...user_research_checklist` (662a1eb) and `.../compare/main...codex/create-behavioral-design-document-l86nas` (f57d019); `.ai/handoff.md:26`; gotcha 13. Related: [ADR-0031](0031-rebuild-v2-from-behavioral-spec-in-phases.md).
