# File Breakdown: `backend/src/modules/agents/phase2/professor-agent/output_schema.ts`

## Layman translation
### Here's what it means in plain terms
- This file defines the exact JSON format for professor-agent session recommendations.

### Why it's built
- It prevents malformed or vague responses from flowing into runtime logic.

### How it helps a service worker switch careers
- It guarantees session advice stays short, ranked, and doable within tight time windows.

## What this file does
- Defines `professorAgentOutputSchema` with strict fields and bounds.
  - **In plain English:** every response must pass a validation checklist.
- Locks identity/version (`professor_agent`, `1.0.0`).
  - **In plain English:** downstream systems know exactly what contract they are reading.
- Constrains session objective length and options count/rank/labels.
  - **In plain English:** users see focused goals and bounded choices.
- Constrains resistance and escalation enums.
  - **In plain English:** signal tags are predictable for policy logic.
- Constrains `next_actions` to exactly 2 entries.
  - **In plain English:** forces concise, immediate execution steps.
