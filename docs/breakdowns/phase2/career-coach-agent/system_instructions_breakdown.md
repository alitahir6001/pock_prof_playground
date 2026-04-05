# File Breakdown: `backend/src/modules/agents/phase2/career-coach-agent/system_instructions.md`

## What this file does
- Defines scope: structured pivot guidance and path-comparison recommendations.
  - **In plain English:** this agent's job is choosing/screening career pivots, not general chatting.
- Defines required outcomes (fit check, up to 3 alternatives, overlap/readiness, exactly two next actions).
  - **In plain English:** every answer must end in concrete options and a simple immediate plan.
- Defines boundaries (strict JSON, advisory-only, no direct state mutation, no therapy framing).
  - **In plain English:** the AI can suggest, but cannot directly change a learner's plan in the system.
- Defines read-only inputs (progress history, resistance signals, overlap estimates, interview coverage).
  - **In plain English:** it uses learner data to reason, but does not edit the data.
- Defines expected outputs (recommendation type, ranked options, preserved-progress framing, next actions).
  - **In plain English:** responses must be decision-ready for the learner and app.

## Why this matters
- Prevents role creep and keeps outputs compatible with guard + schema validation.
  - **In plain English:** the assistant stays in its lane so downstream automation stays safe.

## Risk if missing
- Agent may overstep, produce unstructured text, or provide prohibited guidance.
  - **In plain English:** the app becomes harder to trust and harder to operate.
