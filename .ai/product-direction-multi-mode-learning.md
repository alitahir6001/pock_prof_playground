# Product Direction — Career-Switch is a MODE, not the Product

**Status:** Post-pilot product direction (DO NOT build into the pilot — captured to protect the insight).
**Raised by:** founder, 2026-06-12. Trigger: "I'd use this to learn a language while happy in my career — I don't need the career-switch framing." Founder-as-user signal: wants to use it for *anything* they feel like learning, short- or long-term.

---

## The core realization

The current product is framed for ONE persona — "service-industry worker, 35+, who wants OUT of their career." That narrow framing is correct for the **pilot** (niche down, validate a sharp wedge). But it is a *skin*, not the product. Underneath is a **general adaptive-learning coach** that works for any goal: a language, an instrument, a hobby, a certification, a side skill.

**Career-switching is a MODE on top of a general engine — not the engine itself.**

## Evidence: the engine already generalizes

Split of the 11 behavioral principles (`docs/behavioral_design_v1.md`):

- **Universal learning science (~7 — work for ANY skill):** implementation-intention triggers (P1), micro-proof / bite-size wins (P2), recovery-over-perfection (P3), energy-relative load (P4), identity reinforcement (P5), constrained 3-option sessions (P7), temporal reset windows (P8).
- **Career-switch-specific wrapper (~4 + 2 agents):** interview-proximity checkpoints (P6), skill-transfer/pivot preservation (P9), directional-ambiguity detection (P10), resilience/shame-spiral layer (P11); plus the Career Coach agent and the career-domain onboarding.

The **Professor agent is already topic-agnostic** — it takes `{ topic, comfort_level, minutes }` and produces a daily session. `topic: "conversational Spanish"` works identically to `topic: "IT support"`. The daily engine doesn't know or care that it's a career.

## Sketch: a "Learn a Skill" mode (post-pilot)

Lightest version reuses almost everything:
- **Swap the intake, keep the scaffolding.** Replace "What career domains pull at you?" with "What do you want to learn, and what does 'good enough' look like?" Keep the universal steps as-is: schedule, energy, daily minutes, trigger/cue (none of these are career-specific).
- **Skip the career machinery:** no ranked careers, no interview checkpoints, no pivot/Career-Coach.
- **Onboarding agent variant** produces a *learning plan* (sprint + milestones for the skill) instead of ranked careers — or, even lighter, skip straight to Professor daily sessions with the chosen topic.
- Everything downstream (daily bite-size win, triggers, recovery, sprint) is identical.

A natural top-level fork: **"Switch careers"** vs **"Learn a specific skill"** (and later, broader goals).

## The honest caveat: tone, not just fields

The emotional context differs. The career-switcher carries shame, urgency, "am I too late" — which is *why* the behavioral doc leans hard on recovery/resilience (P3, P11). A happy hobby learner needs none of that protective framing; the **voice shifts lighter**. So a mode is not just "hide the career fields" — the agent souls/tone adapt per mode. Design choice, not a toggle.

## Strategic guidance

- **Pilot = the wedge.** Narrow targeting is a feature for validation. Do NOT add modes to the pilot — it's textbook scope creep (cf. the ship-first decision in `behavioral-science-and-engine-alignment.md`).
- **Architecture is already mode-ready** — the engine isn't hard-coded to careers; only onboarding + Career Coach are. So widening later is additive, not a rewrite. Just avoid baking "career" assumptions deeper as we build.
- **Sequence:** validate the career-switch wedge → then introduce a mode selector + a skill-learning intake + onboarding-agent variant (or a dedicated curriculum agent) → broaden from there.
- **TAM note:** narrow positioning (marketing) + general engine (architecture) = niche down without capping the ceiling. The pilot's job is signal on the wedge; this note preserves the bigger vision for when it's time to widen the funnel.

See also: [[project_pilot_readiness]] and `.ai/behavioral-science-and-engine-alignment.md` (the V9 "app learns the user" vision compounds with this — a general engine + rich logging + personalization).
