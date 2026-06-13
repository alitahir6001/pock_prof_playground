# Behavioral Science & Engine Alignment — Strategic Notes

**Status:** Durable strategic reference. NOT active pilot work. Written 2026-06-12 to inform
**post-pilot** decisions about research, the adaptation engine, and the long-term "the app learns
the user" vision. Future sessions: read this before planning Phase 4+ or any behavioral-rule work.

**Source material:** `docs/behavioral_design_v1.md` (canonical, "do not modify w/o founder approval"),
`docs/system_invariants_v1.md` (normative constraints), `backend/src/modules/adaptation/phase3/policyEngine.ts`.

---

## TL;DR

1. The canonical behavioral doc defines **11 principles + a 6-tier priority order**. The shipped engine
   (`phase3_slice2_v1`) implements a **5-rule slice** with **simplified, single-counter triggers** and a
   **different priority order**. The doc's #1-priority principle (Psychological Safety) is **not implemented at all**.
2. The behavioral doc is internally coherent but **cites no academic sources**, and several thresholds
   ("40%", "180s", "72h") are **invented**. The product goal is "based on real science" — so this gap matters.
3. **"Learning styles" is a debunked myth** — research must explicitly avoid it and target the real
   evidence base (learning science, behavior change, adult/older-adult learning).
4. The product is **"sliced," not "incomplete"** — appropriate for a *concept* pilot. The gaps are a
   Phase 4+ concern, with ONE ethical exception (the missing safety layer).
5. **Sequencing:** don't halt the pilot for research. Pilot validates "do people want this?"; research
   validates "is our behavioral model correct?". Run research as a parallel/post-pilot track that informs
   the *real engine build (Phase 4+)*, not Phase B/C.

---

## DECISION (2026-06-12) — Ship the pilot first; research is a fast-follow

After weighing research-first vs. ship-first, the founder chose **ship-first** (YC "get real signal beats
gold-plating" logic). Confirmed reasoning: the agents already produce reasonable, *safe* output (the guard
blocks the harmful failure mode), and the pilot's goals are answerable on what exists today.

- **Sequence:** finish Phase B (UI) + C (deploy) on the CURRENT agents → pilot → research (agents + engine)
  as a fast-follow informed by real pilot data. Research does NOT block shipping.
- **Pilot's chosen learning goals:** (1) guidance is valued/trusted, (2) users come back, (3) personalization
  feels real.
- **Logging — do NOT expand much:** existing tables already cover those 3 goals (`pilot_sessions` for return
  visits, `pilot_agent_interactions.helpful` + `pilot_feedback_events` for value/personalization). The rich
  event taxonomy below stays a **documented future step**, not pilot scope. (Optional tiny add: onboarding-funnel
  drop-off tracking — only if "usable for non-technical" becomes a goal.)
- **Research execution:** draft the scoped brief now (captured while fresh) + run a cited first-pass scan as a
  fast-follow once the pilot is in motion. Verify all citations.

The rest of this doc (principle→code map, unsourced thresholds, learning-styles caution, operationalization
phase, rich-logging taxonomy) stands as the reference for that post-pilot research/engine work.

---

## Finding 1 — Spec vs. code: the engine is a deliberate slice

The engine literally names itself `phase3_slice2_v1`. Principle → implementation map:

| # | Principle | In code? | Reality |
|---|---|---|---|
| 1 | Implementation Intentions | 🟡 agent only | Onboarding captures `trigger_plan` (primary+fallback). No engine rule for "<40% → reconfigure". |
| 2 | Micro-Proof Momentum | 🟡 agent only | Professor frames "proof-producing" options. No "3-in-7d → auto-insert" engine rule. |
| 3 | Recovery Over Perfection | 🟡 partial | Code: `missed ≥2 in 7d → −25% workload`. Doc: `72h-to-resume ×2 in 21d → Restart Protocol`. |
| 4 | Energy-Relative Load | 🟡 partial | Code: `late-night ≥3 → schedule-shift nudge`. Doc: `HIGH-load completion <30% in worst band → restrict to LOW`. |
| 5 | Identity Reinforcement | ❌ | Tone guidance in agent souls only; no rule. |
| 6 | Interview Proximity | 🟡 loose | Code: `5 completions → +1 difficulty`. The 12 checkpoints / mock-interview surfacing not built. |
| 7 | Constrained Choice | 🟡 agent only | Professor outputs exactly 3 ranked options ✅. "Reduce to 2 after slow starts" not in engine. |
| 8 | Temporal Reset Windows | ❌ | Not implemented. |
| 9 | Skill Transfer Preservation | 🟡 partial | Code: `pivot_interest → curriculum_recalculation {preserve_overlap_clusters:true}`. Doc's `overlap<0.5 → require coach confirmation` gate missing. |
| 10 | Directional Ambiguity | 🟡 partial | Code: `topic_resistance flag → escalate Career Coach`. Doc's "≥2 domains in 21d → ranked alternatives" simplified to one boolean. |
| 11 | **Psychological Safety / Resilience** | ❌ | **Not implemented.** No Resilience Coach, no abandon-count trigger, no 48h pivot delay. (Doc's HIGHEST priority.) |

**Count:** 5 partial engine rules (all simplified), 2 agent-layer only, 4 absent. Even the "present" rules
are single-counter approximations of the doc's nuanced multi-signal triggers.

### Priority-order divergence
- **Doc order:** Psych-Safety → Recovery → Load → Interview-critical → Acceleration → Pivot.
- **Code order** (`policyEngine.ts` `PRIORITY_ORDER`): topic-resistance → pivot → missed → late-night → completions.
- The code puts **pivot first**; the doc puts it **last** and **safety first**. These are nearly inverted on
  the pivot/safety axis. (CLAUDE.md gotcha #8 flags the order "differs from early docs" — it diverges from
  the *canonical* doc too.)

### Why the doc puts Psych-Safety first (it's sound)
Triage logic: **stabilize before you optimize.** It's the only principle about a user *quitting entirely* or
making an *irreversible* shame-driven pivot. Its action **delays/blocks** a pivot (48h) — protective and
overriding — so it must resolve first to gate downstream actions. The principle is right; its absence in code
is the problem.

---

## Finding 2 — Unsourced thresholds & the "learning styles" trap

- The behavioral doc cites **no academic literature**. Thresholds like 40% / 180s / 72h / 5-in-14d are
  **plausible but invented**. For a "based on real science" product, these need grounding or correction.
- **"Learning styles" (visual/auditory/kinesthetic matching) is one of the most debunked ideas in education
  research** (Pashler et al. 2008; Kirschner 2017; repeated failure to find the "meshing" effect). Any research
  brief MUST explicitly exclude it, or we anchor the product on a myth.

## Finding 3 — The evidence base to actually use

- **Learning science:** spacing, retrieval practice, interleaving, desirable difficulties (Roediger, Bjork,
  Dunlosky 2013), cognitive load theory (Sweller).
- **Behavior change / self-regulation:** implementation intentions (Gollwitzer — strong meta-analytic support;
  already Principle 1), goal-setting (Locke & Latham), fresh-start effect (Milkman/Dai), habit formation.
- **Motivation:** self-determination theory (Deci & Ryan), self-efficacy (Bandura), goal-gradient effect.
- **Adult & older-adult learning (the real differentiator):** andragogy (Knowles), time-poor working-adult
  learning, mid-career transition, cognitive aging (crystallized vs. fluid — 35+ learners have real advantages).

These map onto the doc's existing principles — the doc is implicitly reaching for them; it just isn't sourced.

---

## Strategic conclusion — "sliced," not "incomplete"

Whether the gaps matter depends on **what the pilot is testing**:
- **Concept pilot** (what we're set up for): "Do mid-career service workers find AI-generated personalized
  guidance valuable/usable enough to return?" → almost entirely about **agents + UX**. Most deep rules only
  fire over weeks, so a 2–4 week pilot won't exercise them. The 5-rule slice is **fine** here.
- **Adaptation pilot:** "Does our deterministic engine actually change behavior?" → the gaps (esp. safety)
  matter much more. We are NOT set up for this.

**One ethical flag:** the missing Psych-Safety layer is the one gap with a human-harm edge. Even a lightweight
version is worth a conscious decision before vulnerable users use it. (Partial mitigation already exists: the
output guard forbids therapy/hopeless/diagnostic language, and the Career Coach soul forbids validating
hopeless framing — but there's no behavioral *trigger* that detects an at-risk user.)

---

## The research track (post-pilot or parallel — NOT blocking the pilot)

**Scope (the science-real version of the request):** "Evidence-based learning + behavior change +
adult/older-adult learning for **time-poor, mid-career (35+), high-fatigue** adults switching careers."

**Explicit exclusions:** learning styles / VAK matching; anything without empirical support; pop-psych.

**What good output looks like:** for each of the 11 principles → (a) is it supported? (b) by what evidence?
(c) what's the *defensible* threshold/effect size? (d) what should change? Plus: principles we're *missing*.

**Sequencing recommendation:** run research as a **parallel/post-pilot track**. The pilot generates real
behavioral data that complements the research. Research informs **Phase 4+ (the real engine)**, not Phase B/C.

**Tooling:** a dedicated deep-research tool with a scoped brief, OR a cited first-pass scan in-session
(verify every citation — AI can misattribute). A research brief should be drafted before running either.

---

## The "research → programmable features" phase (YES, it's a distinct phase)

Research produces *findings* ("retrieval practice beats rereading"; "implementation intentions ~roughly double
follow-through"). Turning those into **deterministic, auditable engine rules** is a separate, non-trivial
**operationalization** step:
- Map each validated finding → a rule predicate over **persisted events** (per invariants §1.3: no LLM memory,
  no wall-clock randomness).
- Choose **evidence-grounded thresholds + explicit windows** (7/14/21/30d) replacing the invented ones.
- Decide the **layer**: engine rule vs. agent-prompt behavior vs. UI default (not everything is an engine rule).
- Define **priority + tie-breaking** and structural-vs-non-structural classification.
- Version it (metric/formula versioning per invariants §7).

Call this phase **"Operationalization (research → rules)."** It sits between Research and Build.

---

## Rules-to-code alignment — answers to the open questions

**When?** **Post-pilot AND research-informed.** Do NOT align the code to the (unsourced) doc *before* research —
that hardens guesses into code. Order: Pilot (now) → Research (parallel/after) → Operationalization →
Build full engine (Phase 4+).

**Should all 11 be "in the engine"?** Not as 11 engine rules. The target is **11 principles each implemented at
the right layer**: some are engine rules (recovery, load, pivot-gating, safety), some are agent-prompt behavior
(micro-proof, identity tone), some are UI/onboarding (constrained choice, trigger capture, reset windows). And
only after research confirms they're the right 11 with the right thresholds.

**Which priority order wins — doc or code?** Conceptually the **doc's logic wins** (safety-first triage is the
principled design; the code's pivot-first order is a slice artifact that even contradicts the doc). BUT the
*specific* ordering should itself be validated in research. Near-term: treat the code order as provisional
(gotcha #8), and when the engine is next built out, realign to safety-first. Don't canonize the current code order.

---

## Rich logging — setting up the V9 "learn the user" vision

The architecture is **event-sourced** (append-only events; invariants §4). That log is the substrate a future
personalization/learning layer trains on. **Data not collected now is gone forever.** So:

**Recommendation:** define a **behavioral event taxonomy now** and emit events during the pilot **even for
behaviors no current rule consumes**. The behavioral doc already enumerates the signals per principle — that's a
ready-made taxonomy. Grouped:
- **Engagement/session:** `session_started{trigger_type}`, `session_missed`, `session_resumed`, `hours_to_resume`,
  `session_start_time`, `time_to_first_action`, `option_selected_rank`.
- **Proof/competence:** `session_has_output`, `artifact_submitted`, `node_completed`, `assessment_scored`,
  `competency_node_mastered`.
- **Load/energy:** `task_load_level`, `completion_rate_by_time_band`.
- **Progress:** `milestone_completed`, `milestone_stall_days`, `percent_interview_critical_complete`.
- **Direction/pivot/risk:** `topic_resistance_flag`, `pivot_requested`, `overlap_ratio_preserved`,
  abandon events, pivot attempts, restart-protocol activations.
- **Reset:** `weekly_reset_opened`, `first_session_within_24h`.

Each event MUST carry `event_schema_version` (invariants §4.2) and be append-only. Also bank, cheaply and
transparently (pre-ML, auditable):
- **Deterministic profile tags** (already specced, behavioral doc §3): LATE_NIGHT_LEARNER, CHAOTIC_SCHEDULER,
  EXPLORER, CONSISTENT_EXECUTOR, AVOIDANT_UNDER_COMPLEXITY — influence UI/tone only, no auto-mutation.
- **Inferred preferences** surfaced transparently (no black box) — a credible V2–V3 step toward the V9 "learns
  you" dream without leaping to opaque ML.

**Scope decision (OPEN):** "log richly now" slightly expands pilot scope (an events table + emit calls). Options:
(a) add a minimal event-logging slice to Phase B/C now; (b) keep the pilot minimal and start rich logging
immediately after. Recommendation: define the taxonomy now; implement the *cheap, high-value subset* during the
pilot (agent interactions are already logged; add session_started/missed/resumed + artifact_submitted); defer the
rest. Decide explicitly when scoping Phase B/C.

---

## Open decisions (carry forward to post-pilot)
1. Concept pilot vs. adaptation pilot — confirm what the pilot must validate (drives how much engine matters).
2. Lightweight Psych-Safety mitigation before real users? (the one ethical gap).
3. Research: in-session cited scan vs. dedicated deep-research tool. Draft the brief either way.
4. Rich-logging scope in the pilot (minimal slice now vs. immediately after).
5. After research+operationalization: realign engine priority order to safety-first; re-derive thresholds.
