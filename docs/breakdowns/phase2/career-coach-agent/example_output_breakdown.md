# File Breakdown: `backend/src/modules/agents/phase2/career-coach-agent/example_output.json`

## What this file does
- Provides a concrete valid sample for `career_coach_agent` schema version `1.0.0`.
  - **In plain English:** this is a "known good" example response.
- Demonstrates `pivot_preview` with ranked options and overlap preservation numbers.
  - **In plain English:** shows how to suggest alternatives without forcing a hard pivot yet.
- Demonstrates concise preserved-progress summary and exactly two next actions.
  - **In plain English:** proves the output can be both empathetic and operational.

## Why this matters
- Gives developers/tests a baseline artifact for validation and regression checks.
  - **In plain English:** if the model output drifts, we can compare against this sample and catch it early.

## Risk if missing
- Teams may interpret schema expectations inconsistently.
  - **In plain English:** everyone starts guessing what "good output" means.
