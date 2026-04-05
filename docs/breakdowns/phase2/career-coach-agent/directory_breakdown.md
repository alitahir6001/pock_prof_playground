# Directory Breakdown: `backend/src/modules/agents/phase2/career-coach-agent/`

## Purpose of this directory
- This directory defines one complete AI agent contract for career-pivot coaching: personality, boundaries, output schema, and an example payload.
  - **In plain English:** this folder is the "job description + output form" for the Career Coach AI.

## Why this exists in the project
- The project needs career-change guidance to be safe, consistent, and machine-readable before any downstream adaptation logic uses it.
  - **In plain English:** if the AI gives random/free-form answers, the rest of the app can break or mislead users.

## File map
- `soul.md` = voice and stance.
  - **In plain English:** how the coach should sound and behave.
- `system_instructions.md` = strict operating rules.
  - **In plain English:** what the coach is and is not allowed to do.
- `output_schema.ts` = hard JSON contract.
  - **In plain English:** the exact format the app expects every response to follow.
- `example_output.json` = canonical sample output.
  - **In plain English:** a known-good example everyone can copy and test against.

## Relevance to learners (bartender/service-worker career shift)
- This agent helps compare practical pivot paths while preserving progress already earned.
  - **In plain English:** if someone wants out of hospitality, it suggests realistic next paths without throwing away all prior effort.
