---
status: superseded by ADR-0009
date: 2025-07-14
---
# Use the hosted Gemini API instead of a local Ollama model

## Context and Problem Statement
The prototype ran on a local Ollama model ([ADR-0001](0001-prototype-local-llm-ollama-behind-fastapi.md)) and was being deployed, with the frontend pointed at a Railway URL the same day (6955414). A local model cannot back a hosted demo.

## Considered Options
* Local Ollama + Gemma3 (ADR-0001)
* Hosted Gemini API, `gemini-2.5-flash` or `gemini-2.5-pro` chosen by the `GEMINI_MODEL` env var

## Decision Outcome
Chosen option: "Hosted Gemini API", replacing the Ollama call (17c6f04, ab8f1f3). The default model moved from flash to pro on 2025-11-09 (46a47a2). The reason for that switch is not recorded.

### Consequences
* Good, because the backend could run on a host with only an API key (17c6f04 requires `GEMINI_API_KEY` at boot).
* Bad, because the app depended on one provider with no fallback.

## More Information
Evidence: 17c6f04, ab8f1f3, 6955414, 46a47a2. Superseded by [ADR-0009](0009-multi-provider-ai-fallback-via-raw-fetch.md).
