---
status: superseded by ADR-0034
date: 2025-08-17
---
# Harden the Python backend: rate limit, input denylist, delimited prompt, output check, host and origin lists

## Context and Problem Statement
The FastAPI prototype took free-text subject, skill level and goal fields and pasted them into a Gemini prompt ([ADR-0002](0002-hosted-gemini-api-over-local-ollama.md)), on a public host. The question was how to limit abuse and prompt injection.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: layered controls in `prototype/backend/main.py`. The reason is not recorded beyond the commit titles ("hardened backend", "security improvements").

Added 2025-08-17 (731d8fb, 9aa6a5b; 7eb162f fixed the limiter and tightened the output check):
* `slowapi` rate limit of 5 requests a minute per client address on the curriculum endpoint.
* A Pydantic validator that strips tags and rejects input containing phrases such as "ignore previous instructions", "system prompt" and "act as"; `subject` capped at 200 characters.
* The user's fields placed between `--- USER REQUEST ---` and `--- END USER REQUEST ---`, with an instruction to use only that section.
* An output check: the model's JSON `subject` must equal the requested subject, or the response is rejected.

Added 2025-10-19 (9c8e44e, f9bb3fd, 9978429):
* `TrustedHostMiddleware` with an allowed-host list, plus one production host from `ALLOWED_HOST`.
* CORS limited to listed origins plus `FRONTEND_URL`, and to `GET` and `POST`.

### Consequences
* Good, because the per-address limit capped paid model calls from one client.
* Good, because the allowed-origin list from env is the pattern the Node backend kept: one exact `FRONTEND_ORIGIN`, never a wildcard (see [ADR-0023](0023-pilot-address-learn-pakfro-dev.md), [ADR-0043](0043-production-guards-keyed-on-node-env.md); the link between them is inferred, no commit states it).
* Bad, because a phrase denylist is easy to get around with rewording.

## More Information
Evidence: 731d8fb, 9aa6a5b, 7eb162f (2025-08-17), 9c8e44e, f9bb3fd, 9978429 (2025-10-19); the final file is `prototype/backend/main.py` at 08602c6^ ("v1.6.0 - Hardened Security with Environment Variables"). Removed with the prototype in 08602c6. The Node backend did not carry the denylist; prompt-injection hardening there was assessed low and deferred (`.claude/skills/pocket-professor-architecture-contract/SKILL.md`, "Known-weak points"). Superseded by [ADR-0034](0034-v2-stack-node-typescript-fastify-postgres.md).
