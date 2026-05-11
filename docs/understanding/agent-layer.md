# Understanding: Agent Layer

_Plain-English mental model. No TypeScript required._
_Updated by coding agent. Reflects Phase 2 complete / AI wiring pending state._

---

## What it does

The agent layer is the part of the system that talks to users in a human voice. There are three agents — Onboarding, Professor, and Career Coach — each with a strictly defined personality and a contract that specifies exactly what structured data they must return. They advise. They never directly change anything.

---

## How it works (concept walkthrough)

Think of each agent as a **specialist consultant with a strict report format.**

Each agent has four files that define its contract:

| File | What it defines |
|---|---|
| `soul.md` | Tone and personality — how it speaks, what it cares about |
| `system_instructions.md` | Role boundaries — what it can and can't do, what it must output |
| `output_schema.ts` | The exact JSON shape its response must match |
| `example_output.json` | A reference payload used for testing and (currently) as a placeholder response |

When a user runs an agent, the flow is:
1. User input arrives at the endpoint (`POST /pilot/agents/:agentType/run`)
2. The input + the agent's system instructions get sent to an AI model _(not yet — currently returns static `example_output.json`)_
3. The AI response is validated against `output_schema.ts` by `agentOutputGuard.ts`
4. The validated output is stored in `pilot_agent_interactions` (both input and output, as JSONB)
5. The output is returned to the frontend

**What each agent does:**

**Onboarding Agent** — runs once when a user first signs up. Asks about their current situation, goals, and constraints. Returns: 3 ranked career path options, the user's primary motivation trigger, a proposed 14-day sprint, and risk flags (these feed into the adaptation engine later).

**Professor Agent** — runs during learning sessions. Delivers structured lesson content based on the user's current topic and comfort level. Returns: lesson content, comprehension check, session summary.

**Career Coach Agent** — runs when the adaptation engine escalates (topic resistance rule fires) or the user asks for it. Helps the user work through what feels stuck. Returns: reflection prompts, reframing suggestions, concrete next step.

---

## Key decisions and why

**Why strict JSON output schemas?**
Agents are called by the adaptation engine downstream. If an agent returns free-form text, nothing can safely consume it. Strict schemas make agents predictable components, not black boxes. The schema validation (`agentOutputGuard.ts`) acts as a safety net — if the AI returns something that doesn't match, it's rejected before anything downstream sees it.

**Why "advisory only"?**
Agents recommend. The policy engine decides. This separation means you can change what an agent suggests without changing what the system actually does, and vice versa. It also means agents can never directly modify user state — only the deterministic adaptation engine can do that.

**Why three separate agents instead of one?**
Each agent has a different emotional register and role. The Professor is patient and instructional. The Career Coach is reflective and motivational. The Onboarding agent is curious and diagnostic. Merging them would dilute each voice and make the system feel inconsistent to users.

---

## Gotchas

- **AI is not wired yet.** All three agent endpoints currently return the static `example_output.json` for that agent. Real AI (Gemini → OpenAI → Claude fallback) is the next backend task.
- **`agentOutputGuard.ts` exists but is not currently called in the route handler.** It must be wired in when real AI is connected. Don't skip it — it's the safety net that prevents malformed AI responses from reaching the frontend or the adaptation engine.
- **Input is not validated before storage.** The current route handler stores whatever arrives in the `input` field without checking it against the agent's expected schema. Fine for now, worth noting for later.
- **No deduplication.** Calling the same agent twice creates two interaction records. That's by design — the audit trail captures every run.
- **Onboarding runs once but isn't enforced.** There's no code that prevents running it multiple times. The intent is once-per-user, but that's not enforced at the API level.

---

## Reading guide

To understand this subsystem, read in this order:

1. `docs/phase2_agent_system_design.md` — the full design rationale for the contract-first approach
2. `backend/src/modules/agents/phase2/onboarding-agent/soul.md` — read one soul file to understand the personality model
3. `backend/src/modules/agents/phase2/onboarding-agent/system_instructions.md` — the clearest example of the advisory-only contract and output requirements
4. `backend/src/modules/agents/phase2/onboarding-agent/output_schema.ts` — what a bounded, structured output contract looks like
5. `backend/src/modules/agents/phase2/validation/agentOutputGuard.ts` — the safety layer; understand `SCHEMA_VALIDATION_FAILED`, `UNMAPPED_ACTION`, `PROHIBITED_CONTENT`
