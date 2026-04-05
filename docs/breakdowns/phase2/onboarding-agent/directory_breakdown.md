# Directory Breakdown: `backend/src/modules/agents/phase2/onboarding-agent/`

## Layman translation
### Here's what it means in plain terms
- This directory defines how the onboarding AI should think, speak, and format decisions for users starting a career transition.

### Why it's built
- It exists to keep first-step guidance consistent, safe, and usable by the rest of the system.

### How it helps a service worker switch careers
- It turns "I'm overwhelmed" into a ranked path choice plus a simple 14-day plan they can actually do.

## Purpose of this directory
- This folder defines one complete contract for the Onboarding Agent: identity, boundaries, schema, and sample output.
  - **In plain English:** this is the onboarding coach's playbook plus response template.

## File map
- `soul.md` = voice/stance definition.
  - **In plain English:** how the coach should sound and behave.
- `system_instructions.md` = operating boundaries and required outcomes.
  - **In plain English:** what the coach must do every time and what it must never do.
- `output_schema.ts` = strict output contract.
  - **In plain English:** the exact JSON shape required for acceptance.
- `example_output.json` = canonical valid sample.
  - **In plain English:** a concrete example of "good output".
