Behavioral Design Document v1.0

Product: The Professor
Status: Canonical (Do Not Modify Without Explicit Founder Approval)

1. Mission

The Professor exists to increase the likelihood that overworked service industry workers (age 35+, chaotic schedules, high fatigue) land interviews in higher-paying career fields.

The system optimizes for:

Competence evidence

Interview readiness

Recovery resilience

Pivot preservation

Chaos-adaptive planning

It does NOT optimize for:

Streak perfection

Dopamine gamification

Therapy

Passive content consumption

2. Core Behavioral Principles

All adaptation must derive from stored behavioral events.
No adaptation may rely on LLM memory.

All rules must be deterministic and auditable.

Principle 1: Implementation Intentions Under Volatility

Description
Pre-commitment to action reduces willpower dependence under stress.

Product Requirement
Users must define:

1 Primary Study Trigger

1 Fallback Trigger

Trackable Signals

plan_created

session_started {trigger_type}

percent_sessions_within_trigger_window

Rule
If percent_sessions_within_trigger_window < 40% over 14 days:
→ Force trigger reconfiguration.

Principle 2: Micro-Proof Momentum

Description
Users require tangible competence evidence within short sessions.

Every session must produce one of:

A micro artifact

A completed competency node

A scored assessment

A mini real-world simulation

No theory-only sessions allowed.

Signals

session_has_output

artifact_submitted

node_completed

assessment_scored

Rule
If 3 sessions in 7 days end without tangible output:
→ Auto-insert proof-producing micro-task next session.

Principle 3: Recovery Over Perfection

Description
Dropout risk is driven by shame spiral after missed sessions.

Signals

session_missed

session_resumed

hours_to_resume

Rule
If hours_to_resume > 72 twice in 21 days:
→ Trigger Restart Protocol (3 low-load sessions).

Priority Level: High

Principle 4: Energy-Relative Load Matching

Description
Cognitive load must align with user-specific energy windows.

Tasks must be tagged:

LOW

MEDIUM

HIGH

Signals

session_start_time

task_load_level

completion_rate_by_time_band

Rule
If HIGH load completion < 30% within user’s lowest-performing time band across 10 attempts:
→ Restrict that band to LOW tasks only.

Principle 5: Identity Reinforcement Through Evidence

Description
Sustained behavior requires identity shift supported by proof.

Artifacts must be framed as:

“Proof of Becoming”

“Field Simulation”

“Real-World Preview”

Not “assignments” or “homework.”

Signals

artifact_submitted

competency_node_mastered

Rule
If no artifact in 14 days:
→ Next sprint must include artifact-producing task before unlocking new theory.

Principle 6: Interview Proximity Framing

Description
Motivation increases as perceived interview-readiness increases.

Replace single progress bar with 12 Interview Readiness Checkpoints.

Signals

milestone_completed

milestone_stall_days

percent_interview_critical_complete

Rules
If stall > 10 days:
→ Insert quick-win checkpoint.

If percent_interview_critical_complete > 60%:
→ Surface mock interview preview.

Principle 7: Constrained Choice Architecture

Description
Under fatigue, too many options increase avoidance.

At session start, show max 3 ranked tasks:

Best Next

Easier Fallback

Catch-Up

Signals

time_to_first_action

option_selected_rank

Rule
If time_to_first_action > 180 seconds in 4 of last 7 sessions:
→ Reduce to 2 options and pre-highlight Best Next.

Principle 8: Temporal Reset Windows

Description
Fresh-start moments improve recommitment.

Weekly Reset (Sunday) + Reset after 5 days inactivity.

Signals

weekly_reset_opened

first_session_within_24h

Rule
If reset ignored twice:
→ Replace full reset UI with single 10-minute task prompt.

Principle 9: Skill Transfer Preservation (Pivot Without Loss)

Description
Pivots must preserve overlapping skill clusters.

Signals

pivot_requested

overlap_ratio_preserved

Rule
If overlap_ratio_preserved < 0.5:
→ Require Career Coach confirmation before pivot commit.

Principle 10: Directional Ambiguity Detection

Description
Low engagement across domains suggests misalignment.

Signals

topic_resistance_flag

multi-domain low completion

artifact_gap > 21 days

Rule
If resistance across >=2 domains in 21 days:
→ Trigger ranked alternative path suggestion.

Principle 11: Psychological Safety & Resilience Layer

Description
System must prevent shame-driven reactive pivots.

This is NOT therapy.
This is momentum preservation.

Trigger Signals

5+ abandon events in 14 days

2+ pivot attempts in 30 days

repeated restart protocol activations

Rule
Trigger Resilience Coach Agent before pivot confirmation.

Agent must:

Show preserved progress

Reframe stagnation

Offer 2 small next actions

Delay pivot confirmation by 48 hours

Agent must NOT:

Provide mental health advice

Diagnose

Validate hopeless framing

Highest Priority Tier.

3. Behavioral Profile Tagging (POC Only)

Tags are deterministic.

They influence UI defaults and tone only.

Tags:

LATE_NIGHT_LEARNER

CHAOTIC_SCHEDULER

EXPLORER

CONSISTENT_EXECUTOR

AVOIDANT_UNDER_COMPLEXITY

No automatic curriculum mutation based solely on tags.

4. Rule Priority Order

Psychological Safety / Resilience

Recovery

Load Calibration

Interview Critical Reprioritization

Progress Acceleration

Pivot Exploration

Constraint:
Max 1 structural curriculum mutation per weekly evaluation cycle.

All adaptations must output:

rule_id

trigger_window

events_used

mutation_applied

previous_state

new_state

5. POC Constraints

No ML

No reinforcement learning

Manual curation of 10–15 career paths

Deterministic rules only

Agents output strict JSON only

END OF DOCUMENT