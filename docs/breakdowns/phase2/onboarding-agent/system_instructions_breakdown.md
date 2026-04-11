# File Breakdown: `backend/src/modules/agents/phase2/onboarding-agent/system_instructions.md`

## Layman translation
### Here's what it means in plain terms
- This file is the rulebook for what the onboarding agent must deliver in each response.

### Why it's built
- It creates deterministic, machine-usable onboarding decisions instead of open-ended chat.

### How it helps a service worker switch careers
- It ensures users get ranked options, trigger habits, and a short starter sprint instead of vague advice.

## What this file does
- Defines scope: structured onboarding decisions only.
  - **In plain English:** this agent decides onboarding setup, not everything in the app.
- Defines required outcomes: top 3 paths, primary/fallback trigger, 14-day sprint frame, risk flags.
  - **In plain English:** every response must produce a concrete kickoff plan.
- Defines boundaries: strict JSON, advisory-only, no direct state mutation, no therapy/diagnosis/crisis language.
  - **In plain English:** the AI suggests safely, but does not directly change learner records.
- Defines read-only inputs: profile, schedule constraints, skills/goals, entitlement tier.
  - **In plain English:** it uses context data but cannot edit that data.
- Defines outputs: ranked options, trigger recommendation, initial actions, short bounded rationale.
  - **In plain English:** useful next steps, not essays.
