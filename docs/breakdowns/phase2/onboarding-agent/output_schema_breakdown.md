# File Breakdown: `backend/src/modules/agents/phase2/onboarding-agent/output_schema.ts`

## Layman translation
### Here's what it means in plain terms
- This file defines the exact JSON structure the onboarding agent must return.

### Why it's built
- It blocks malformed responses and keeps downstream policy logic deterministic.

### How it helps a service worker switch careers
- It guarantees first-step guidance is complete (ranked paths + trigger plan + sprint + risks).

## What this file does
- Defines `onboardingAgentOutputSchema` using Zod.
  - **In plain English:** this is the validator that every onboarding response must pass.
- Requires fixed identity/version (`onboarding_agent`, `1.0.0`).
  - **In plain English:** the system can reliably identify which contract is being used.
- Requires exactly 3 ranked career options with constrained rationale tags.
  - **In plain English:** users always get a short, comparable decision set.
- Requires trigger plan (primary + fallback) with bounded text.
  - **In plain English:** users get a backup plan when schedules break.
- Requires fixed 14-day sprint envelope and bounded daily minute target.
  - **In plain English:** keeps plans realistic for overworked learners.
- Constrains risk flags and next actions cardinality/length.
  - **In plain English:** keeps output actionable and safe for downstream processing.
