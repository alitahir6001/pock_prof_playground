# File Breakdown: `backend/src/modules/agents/phase2/professor-agent/example_output.json`

## Layman translation
### Here's what it means in plain terms
- This file shows a valid example of daily session guidance from the professor agent.

### Why it's built
- It gives developers and prompt reviewers a concrete reference for expected output quality.

### How it helps a service worker switch careers
- It models a short, realistic session plan with backup options for low-energy days.

## What this file does
- Demonstrates valid identity/version and a concise session objective.
  - **In plain English:** confirms baseline contract fields are present.
- Demonstrates three ranked options across `best_next`, `easier_fallback`, and `catch_up`.
  - **In plain English:** users can choose the best available effort level today.
- Demonstrates resistance signal + escalation recommendation fields.
  - **In plain English:** captures friction signals for adaptation without overreacting.
- Demonstrates exactly two next actions.
  - **In plain English:** ends with immediate steps, not long narratives.
