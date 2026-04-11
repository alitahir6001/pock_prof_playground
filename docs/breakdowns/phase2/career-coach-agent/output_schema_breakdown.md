# File Breakdown: `backend/src/modules/agents/phase2/career-coach-agent/output_schema.ts`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## What this file does
- Defines Zod schema for the entire Career Coach output payload.
  - **In plain English:** this is the strict checklist a response must pass before the app accepts it.
- Constrains identity/version fields (`agent`, `schema_version`).
  - **In plain English:** guarantees the app knows exactly which agent and format produced the response.
- Constrains recommendation and rationale enums.
  - **In plain English:** limits decisions to known, explainable categories (no random labels).
- Constrains pivot options (max 3, rank 1-3, overlap ratio 0..1, ETA bounded).
  - **In plain English:** recommendations stay realistic, ranked, and comparable.
- Constrains narrative fields (`preserved_progress_summary`, `next_actions`).
  - **In plain English:** keeps text short, clear, and immediately actionable.

## Why this matters
- Converts prompt guidance into enforceable machine rules.
  - **In plain English:** style docs are suggestions; this schema is the hard gate.

## Risk if missing
- Bad outputs can silently pass and break downstream flows.
  - **In plain English:** the app could act on malformed advice.
