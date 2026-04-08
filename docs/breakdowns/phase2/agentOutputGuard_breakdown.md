# File Breakdown: `backend/src/modules/agents/phase2/validation/agentOutputGuard.ts`

## Layman translation
### Here's what it means in plain terms
- This file is a strict safety gate that checks agent JSON before the system accepts it.

### Why it's built
- It blocks malformed data, unknown actions, and prohibited clinical/therapy-style language.

### How it helps a service worker switch careers
- It prevents confusing or unsafe agent responses from affecting their learning plan.

## What this file does
- Defines shared guard result types and rejection reasons (`SCHEMA_VALIDATION_FAILED`, `UNMAPPED_ACTION`, `PROHIBITED_CONTENT`).
  - **In plain English:** every bad payload is rejected with a clear reason code.
- Defines prohibited-language pattern scanning across nested payload fields.
  - **In plain English:** catches banned wording even if hidden in arrays/objects.
- Defines agent-specific validators for onboarding, professor, and career-coach payloads.
  - **In plain English:** each agent gets its own strict contract checks.
- Enforces key whitelists, enum memberships, cardinality limits, and bounded field lengths.
  - **In plain English:** blocks random fields and out-of-bounds values.
- Exposes `validateAgentOutput(agent, payload)` as the single guard entrypoint.
  - **In plain English:** one function decides pass/fail before downstream usage.

## Why this is high leverage
- It turns prompt contracts into enforceable runtime safety.
  - **In plain English:** this is the practical "seatbelt" for agent outputs.
