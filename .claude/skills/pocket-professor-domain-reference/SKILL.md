---
name: pocket-professor-domain-reference
description: Domain knowledge for Pocket Professor - the 5 adaptation rules and their exact code semantics, the 3 agent contracts and output guard, behavioral-science grounding (and what is unsourced), the pilot's Wizard-of-Oz model, tracks/sprint/retention concepts. Triggers - working on policyEngine, agents, prompts, guard, onboarding flow, sprint loop, adaptation rules, behavioral principles, "why does the engine/agent do X", pilot metrics, retention.
---

# Pocket Professor — Domain Reference

What the product actually is, in the terms this repo uses. Not a textbook: only the domain facts a mid-level engineer needs to work HERE.

**When NOT to use this skill:** commands/config/debugging → `pocket-professor-runbook`; design rationale and invariants → `pocket-professor-architecture-contract`; whether you may change something → `pocket-professor-change-control`.

## Glossary

| Term | Meaning here |
|---|---|
| **Career-switcher** | Pilot persona: service-industry worker (bars/restaurants), often 35+, wanting into IT/tech. Chosen because the founder is one (15-year veteran) |
| **Track** | One AI-suggested career option (e.g. "IT support"). Onboarding produces 3–6; user picks one, can switch later WITHOUT losing progress |
| **Sprint** | 14-day plan of daily sessions. One `pilot_plans` row per user; each completed day = a `pilot_sprint_days` row (`completed_at` = the return signal) |
| **Session signal** | Counters about a user's recent behavior (missed sessions, late-night sessions, completions, resistance/pivot flags) fed to the policy engine |
| **Structural mutation** | A mutation that rewrites the curriculum graph. In code, exactly the set `{curriculum_recalculation}` (`STRUCTURAL_MUTATION_TYPES`, policyEngine.ts:14) |
| **Wizard-of-Oz adaptation** | Pilot decision (session 8): the engine is NOT wired to the frontend. The founder watches the admin cohort and manually does what a rule would do. Validates whether adaptation matters before automating |
| **Retention loop** | The pilot's actual success metric — do users come back — NOT plan quality ("a ChatGPT plan is free; the moat is the accountability loop") |

## The 5 adaptation rules — exact code semantics

Source of truth: `backend/src/modules/adaptation/phase3/policyEngine.ts` (engine version `phase3_slice2_v1`).

Priority order (highest first, `PRIORITY_ORDER` at line 21):

| # | rule_id | Fires when | Window | Mutation |
|---|---|---|---|---|
| 1 | `R_TOPIC_RESISTANCE_ESCALATE_CAREER_COACH` | `topic_resistance_triggered` true | 21d | `agent_escalation` → career_coach_agent |
| 2 | `R_PIVOT_INTEREST_RECALCULATE_GRAPH` | `pivot_interest_triggered` true | 7d | `curriculum_recalculation` (STRUCTURAL) |
| 3 | `R_MISSED_2_IN_7D_REDUCE_WORKLOAD_25` | `missed_sessions_7d >= 2` | 7d | `workload_adjustment` −25% |
| 4 | `R_LATE_NIGHT_3_SHIFT_SCHEDULE` | `late_night_sessions_7d >= 3` | 7d | `schedule_shift_recommendation` |
| 5 | `R_COMPLETED_5_INCREASE_DIFFICULTY` | `consecutive_completed_sessions >= 5` | 7d | `difficulty_adjustment` +1 slight |

**Verified code behavior (differs from CLAUDE.md's shorthand):** the engine applies **ALL matched rules**, sorted by priority — not only the first match. Structural mutations beyond the weekly cap (`MAX_STRUCTURAL_MUTATIONS_PER_WEEK = 1`, minus `weekly_structural_mutations_applied`) are moved to `deferred_mutations` with reason `STRUCTURAL_CAP_REACHED`; everything else still applies. CLAUDE.md's "applies the first match" is a simplification — trust `evaluatePolicies()` (policyEngine.ts:115).

Input validation is strict: counters must be finite numbers / booleans or `evaluatePolicies` throws. No defaults, no coercion — determinism by refusal.

**Pilot status:** the frontend sends NO session signals; `/adaptation/evaluate` is internal-token-gated in prod and called by nobody. The rules run only in tests/smokes. See Wizard-of-Oz above.

## Behavioral-science grounding (and its limits)

`docs/behavioral_design_v1.md` defines 11 principles; the engine implements a 5-rule SLICE. Full mapping + caveats: `.ai/behavioral-science-and-engine-alignment.md` — read it before any behavioral-rule work. The load-bearing caveats:

- **The numeric thresholds (2 missed, 3 late-night, 5 completions) are unsourced** — plausible, not evidence-based. One purpose of Wizard-of-Oz piloting is to calibrate them from real interventions.
- **"Learning styles" is a debunked myth** — must stay out of any future research/personalization work.
- ~7 principles are universal learning science; ~4 are career-switch-specific. This is why career-switch is a MODE, not the product (`.ai/product-direction-multi-mode-learning.md`) — don't bake "career" assumptions deeper than onboarding + Career Coach.

## The 3 agents

Contracts in `backend/src/modules/agents/phase2/<agent>/`: `soul.md` (voice), `system_instructions.md` (behavior), `output_schema.ts`, `example_output.json` (last-resort fallback + drift-guard fixture).

| Agent | Route agentType | Tier | Job |
|---|---|---|---|
| Onboarding | `onboarding_agent` | `deep` | Intake → 3–6 ranked career tracks + sprint recommendation. Re-run with `refinement` context for the escape hatch / thumbs-down regenerate |
| Professor | `professor_agent` | `fast` | Daily session: `{topic, comfort_level, minutes, day context}` → 3 bounded task options. Topic-agnostic (the multi-mode insight) |
| Career Coach | `career_coach_agent` | `deep` | Pivot/resistance counseling. Currently UNUSED by onboarding (kept for future); would be the escalation target of rule 1 |

Inference path: `agentInferenceRunner.ts` builds soul + instructions + **strict schema text from `agentPromptSpecs.ts`** + example → provider chain (OpenAI → Gemini → Anthropic) with `validateAgentOutput` as the validate callback → guard failure falls through to next provider → if ALL fail, serve `example_output.json` with `used_fallback:true` (user never sees a 500).

### Guard semantics (`validation/agentOutputGuard.ts`)

- Strict shape: exact field sets, enums, lengths. E.g. onboarding `career_options` length must be 3..6 (line 106), ranks 1–6.
- `PROHIBITED_LANGUAGE` filters: medical/psych diagnosis and prescribing — but ONLY in medical collocation (`diagnose … disorder/depression/…`, `prescribe … medication/…`). Bare "diagnose"/"prescribed" are ALLOWED because this app teaches IT ("diagnose a network issue"). The collocation noun list deliberately excludes tech-colliding words like "condition" (race condition). Don't re-broaden (gotcha #13).
- Prompt rule (session 7): Professor `next_actions` must be plain user copy, never the raw enums `best_next`/`easier_fallback`/`catch_up`.

## Pilot success semantics (session 8, 2026-07-03)

- Judge on retention with **numeric thresholds written down BEFORE the first user** (e.g. X/10 return day-2, Y finish 7+ days). As of 2026-07-06 these are NOT yet written — if the pilot is starting, that's a pre-launch to-do.
- Dropouts are data (capture exit text), not failures.
- Sequence: deploy → founder self-pilots 2–3 days adversarially (phone, cellular, tired, skip days, check the comeback experience) → recruit ~10 (warm bar network + Reddit DMs; ~6–7 committed + 2–3 ambivalents).
- At n=10 the founder IS the retention feature; personal SMS beats automated email for this demographic; design the comeback moment as "welcome back + 10-min catch-up", never shame.

## Provenance and maintenance

Written 2026-07-06 at commit `9d16f26`. Re-verify:
- Rule order/thresholds: `sed -n '1,30p;115,225p' backend/src/modules/adaptation/phase3/policyEngine.ts`
- career_options bounds: `grep -n 'career_options' backend/src/modules/agents/phase2/validation/agentOutputGuard.ts`
- Agent tiers: `grep -n -A5 'agentTierByType' backend/scripts/run_adaptation_fastify.mjs`
- Engine still unwired from frontend: `grep -rn 'adaptation/evaluate' frontend/src/` (expect no hits)
