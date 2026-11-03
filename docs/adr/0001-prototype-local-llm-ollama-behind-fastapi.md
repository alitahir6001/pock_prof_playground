---
status: superseded by ADR-0002
date: 2025-06-23
---
# Prototype: local LLM (Ollama + Gemma3) behind a Python FastAPI backend

## Context and Problem Statement
The first web prototype needed an LLM to generate syllabi from user input. The question was which model to call and from what server.

## Considered Options
* Local Ollama serving Gemma3 (`gemma3:12b-it-q4_K_M`)
* OpenAI API, coded as the other branch of a `USE_OLLAMA` toggle (a1292f4)

## Decision Outcome
Chosen option: "Local Ollama + Gemma3 behind FastAPI", with `USE_OLLAMA = True` as the default (a1292f4). The reason is not recorded.

### Consequences
* Good, because it ran with no API key or per-call cost (inferred from the local endpoint in a1292f4).
* Bad, because a local model cannot serve a deployed app; the timeout had to be raised for the larger model (dfa0693).

## More Information
Evidence: a1292f4 (FastAPI backend with Ollama + Gemma3), e703ad9 (Ollama config in the earlier CLI app), dfa0693. The prototype code was removed in 08602c6. Superseded by [ADR-0002](0002-hosted-gemini-api-over-local-ollama.md).
