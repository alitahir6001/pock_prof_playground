---
status: accepted
date: 2026-06-12
---
# Multi-provider AI fallback (OpenAI, then Gemini, then Anthropic) via raw fetch

## Context and Problem Statement
Agents were returning static example output and needed real AI (`CLAUDE.md` gotcha 3). A single provider ([ADR-0002](0002-hosted-gemini-api-over-local-ollama.md)) is a single point of failure, and Gemini pro latency proved highly variable with transient 503s (gotcha 11).

## Considered Options
* Single provider (ADR-0001, ADR-0002)
* Gemini first, then OpenAI, then Claude (the planned order in `docs/understanding/agent-layer.md:59`)
* OpenAI first, then Gemini, then Anthropic
* Provider SDKs (inferred: the service header states "No third-party SDKs", `aiProviderService.ts:11`)

## Decision Outcome
Chosen option: "OpenAI, then Gemini, then Anthropic, over raw `fetch`" (`backend/src/modules/agents/phase2/ai/aiProviderService.ts:21-26`), because the order balances cost and latency: Gemini pro's latency put it second and Anthropic, the most expensive, is last (gotchas 9, 11). Providers without a key are skipped; any failure falls through. Tiers `fast`/`mid`/`deep` map to per-provider models, each env-overridable. `agentOutputGuard` runs as the `validate` callback (gotcha 7), the strict schema is embedded in the prompt (gotcha 12), and `example_output.json` is the last resort when every provider fails (`CLAUDE.md:140-144`). Added in f3f3063.

### Consequences
* Good, because one provider outage or bad response does not fail the request.
* Good, because `fetch` is injectable, so the service is unit-testable offline (`aiProviderService.ts:11-12`).
* Bad, because each provider's request quirks are hand-encoded and must not be "fixed" back (gotcha 10).

## More Information
Evidence: f3f3063, `aiProviderService.ts:21-26`, `CLAUDE.md:140-144`, gotchas 3, 7, 9, 10, 11, 12. Supersedes [ADR-0002](0002-hosted-gemini-api-over-local-ollama.md). Related: [ADR-0005](0005-three-advisory-agents-with-guarded-json-contracts.md).
