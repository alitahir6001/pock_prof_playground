# Understanding: Adaptation Engine

_Plain-English mental model. No TypeScript required._
_Updated by coding agent. Reflects Phase 3 complete state._

---

## What it does

The adaptation engine watches how a user is behaving — are they missing sessions? staying up late? showing signs of wanting to change direction? — and decides what to do about it. Every decision is deterministic: the same inputs always produce the same outputs. No AI, no randomness. Pure if-then logic.

---

## How it works (concept walkthrough)

Think of it as a **referee with a rulebook.**

Before each evaluation, the system collects counters about the user's recent behavior:
- How many sessions did they miss in the last 7 days?
- How many late-night sessions in the last 7 days?
- Did they show topic resistance?
- Did they show interest in changing direction (pivot)?
- How many sessions in a row have they completed?

Those counters get passed to the **policy engine**, which checks them against five rules in priority order. The rules are checked in this order — highest priority first:

| Priority | Rule | Trigger | Action |
|---|---|---|---|
| 1 | `R_TOPIC_RESISTANCE` | Topic resistance flagged | Escalate to Career Coach agent |
| 2 | `R_PIVOT_INTEREST` | Pivot interest flagged | Recalculate curriculum graph ⚠️ |
| 3 | `R_MISSED_2_IN_7D` | 2+ missed sessions in 7 days | Reduce workload by 25% |
| 4 | `R_LATE_NIGHT_3` | 3+ late-night sessions in 7 days | Suggest schedule shift |
| 5 | `R_COMPLETED_5` | 5 consecutive completions | Increase difficulty |

All matching rules fire — it's not first-match-wins. But curriculum changes (rule 2) are capped at once per week.

After matching, the engine produces two lists:
- **applied mutations** — changes that will happen
- **deferred mutations** — changes that matched but couldn't apply (e.g., already hit the weekly structural cap)

The result is then handed to the **persistence layer**, which writes an audit record to the database. Every evaluation is permanently logged, with the full before/after state.

---

## Key decisions and why

**Why deterministic, not AI?**
Adaptation decisions affect the user's learning path. If a user misses two sessions and the system reduces their workload, that should happen every time — not 70% of the time. Reproducibility also means you can audit and explain every decision made. AI is reserved for *recommendations*, not policy.

**Why counters instead of raw events?**
The engine doesn't read the session event log directly. Counters are computed upstream and passed in. This keeps the engine stateless and fast — it doesn't need a DB connection to evaluate a policy.

**Why cap structural mutations at 1 per week?**
A curriculum recalculation is a big change — it reshuffles what the user studies. Doing it too often would create instability. The cap is a behavioral guardrail, not a technical limit.

**Why fail-closed on structural mutations?**
If a curriculum change is applied but the audit record fails to save, the system loses its audit trail. The solution: if the audit write fails, the curriculum change doesn't apply at all. A missed change is safer than an unaudited one.

---

## Gotchas

- **Counters are not stored in the DB.** They're computed from session events and passed to the engine at call time. The engine itself is stateless.
- **Priority order matters.** Topic resistance (rule 1) fires before workload reduction (rule 3), even if both match. The rules in CLAUDE.md were listed in the wrong order — the engine's actual priority is what's in the table above.
- **Two persistence modes exist.** `file` mode (local dev) writes to a JSON file with a hash chain. `postgres` mode (pilot/prod) writes to `adaptation_evaluations` table. Both behave identically from the engine's perspective.
- **File mode has tamper detection.** Each record in the JSON file stores a hash of the previous record. You can run a chain verification to confirm the audit log hasn't been modified.

---

## Reading guide

To understand this subsystem, read in this order:

1. `docs/behavioral_design_v1.md` — the *why* behind the rules; what behaviors the system is trying to protect
2. `docs/system_invariants_v1.md` — the hard constraints (determinism, fail-closed, mutation cap) and what breaks if you violate them
3. `backend/src/modules/adaptation/phase3/policyEngine.ts` — the rule evaluator; pure function, no side effects, easy to read
4. `backend/src/modules/adaptation/phase3/adaptationEvaluationService.ts` — the orchestrator that wires evaluator → record builder → persistence
5. `backend/src/modules/adaptation/phase3/adaptationEvaluationPersistence.ts` — the transaction logic and fail-closed pattern
