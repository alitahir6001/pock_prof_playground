# File Breakdown: `backend/src/modules/agents/phase2/professor-agent/system_instructions.md`

## Layman translation
### Here's what it means in plain terms
- This file is the strict rule set for how the professor agent must produce session guidance.

### Why it's built
- It ensures deterministic outputs that policy and UI layers can consume safely.

### How it helps a service worker switch careers
- It guarantees each session response includes concrete options and a realistic execution focus.

## What this file does
- Defines scope: structured session guidance only.
  - **In plain English:** this agent handles today's execution decision, not long-term strategy.
- Defines required outcomes: up to 3 ranked options, at least one proof-producing, concise objective framing, resistance flags.
  - **In plain English:** users get actionable options and signal tagging for adaptation.
- Defines boundaries: strict JSON, advisory-only, no state mutation, no structural curriculum changes, no therapy/diagnostic phrasing.
  - **In plain English:** safe assistant suggestions only; no direct system changes.
- Defines read-only inputs: curriculum snapshot, recent metrics/events, entitlement, checkpoint state.
  - **In plain English:** it reasons with current context but does not alter records.
- Defines outputs: ranked options, objective, fallback, policy signal hints.
  - **In plain English:** concise plan for today with adaptation-friendly metadata.
