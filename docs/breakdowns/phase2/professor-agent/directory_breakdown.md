# Directory Breakdown: `backend/src/modules/agents/phase2/professor-agent/`

## Layman translation
### Here's what it means in plain terms
- This directory defines how the day-to-day execution coach responds during learning sessions.

### Why it's built
- It keeps session guidance structured, bounded, and safe for downstream automation.

### How it helps a service worker switch careers
- It gives realistic "what to do today" options when energy is low and schedules are unstable.

## Purpose of this directory
- This folder contains the full contract for the Professor Agent: personality, boundaries, schema, and example output.
  - **In plain English:** this is the day-to-day study coach operating manual.

## File map
- `soul.md` = execution-coach voice and stance.
  - **In plain English:** how this agent should sound while pushing action.
- `system_instructions.md` = required outcomes + hard boundaries.
  - **In plain English:** what this agent must always deliver and what it cannot do.
- `output_schema.ts` = strict response shape.
  - **In plain English:** the exact data format app code expects.
- `example_output.json` = known-good sample.
  - **In plain English:** concrete example used for testing and alignment.
