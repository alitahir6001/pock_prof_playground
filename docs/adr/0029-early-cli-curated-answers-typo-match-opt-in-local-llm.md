---
status: superseded by ADR-0001
date: 2025-03-27
---
# Early CLI: curated answers first, then typo matching, then an opt-in local LLM

## Context and Problem Statement
The first version of Pocket Professor was a Python command-line app that answered study questions (d374bbb, 2025-03-27). The question was where answers come from: a fixed set the author wrote, or a language model.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: a layered lookup in `app.py` (e3e3fd0, 2025-04-08). The reason is not recorded.

1. A curated knowledge base, a Python dict of questions and answers (d374bbb, split out in 0e3e590).
2. An exact, case-insensitive match against its keys.
3. If none, a typo match: each string becomes a set of characters, the score is the size of the intersection over the size of the union (a Jaccard index on character sets), and the best key at or above `threshold=0.8` wins (0ec17cb, wired in 433071e).
4. If still none, the app asks "would you like to ask the LLM? (Yes/No)" and only on yes posts to a local Ollama server at `localhost:11434` (e3e3fd0). The model was `mistral:latest` (2bc94c0, 2025-03-27), then `gemma3:latest` (433071e).

The system prompt cast the model as "a graduate-level college professor" and named its creator "Dr. Pakfro" (36ccc04, e3e3fd0).

### Consequences
* Good, because curated answers needed no model, and the model ran only when the user asked for it.
* Bad, because a character-set score ignores order, so different questions made of the same letters score as near matches (inferred from the algorithm in 0ec17cb).
* Bad, because the LLM step needed Ollama running on the same machine.

## More Information
Evidence: d374bbb, 0e3e590, 2bc94c0, 36ccc04, 0ec17cb, 433071e, e3e3fd0 (all 2025-03-27 to 2025-04-08); later syllabus generation through the same Ollama call, 38533e1 (2025-04-23). The CLI code (`learning/`) was removed in 08602c6. Superseded by [ADR-0001](0001-prototype-local-llm-ollama-behind-fastapi.md), which moved the Ollama call behind a FastAPI backend.
