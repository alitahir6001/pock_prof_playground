/**
 * Strict output contracts, in prompt-ready text, for each agent.
 *
 * These mirror the rules enforced by `validateAgentOutput` in
 * ../validation/agentOutputGuard.ts — that guard is the SOURCE OF TRUTH. If the
 * guard changes, update these specs to match, or live AI output will be
 * rejected and fall back to the canned example. The agents' own
 * `system_instructions.md` only say "strict JSON matching schema" without the
 * actual shape, which is why the prompt must carry it (see CLAUDE.md gotcha 12).
 *
 * `agentSpecConsistency.test.ts` guards against drift by checking each agent's
 * `example_output.json` still passes the guard.
 */
import type { AgentType } from '../validation/agentOutputGuard.js';

export const SCHEMA_SPEC: Record<AgentType, string> = {
  onboarding_agent: [
    'Return a JSON object with EXACTLY these top-level keys (no more, no fewer):',
    '  agent, schema_version, career_options, trigger_plan, sprint_recommendation, risk_flags, next_actions',
    '',
    'Rules:',
    '- agent: the string "onboarding_agent".',
    '- schema_version: the string "1.0.0".',
    '- career_options: an array of 3 to 6 objects (aim for 5–6 varied options across DIFFERENT',
    '  career domains when the user gave enough signal; never fewer than 3). Each object has:',
    '    - path_id: short lowercase_snake_case string identifier',
    '    - title: non-empty human-readable string',
    '    - rank: integer 1..6, unique per option (1 = best fit)',
    '    - rationale_tag: one of ["high_overlap","fast_interview_path","schedule_compatible","entry_level_accessible"]',
    '- trigger_plan: an object with:',
    '    - primary_trigger: string, max 120 chars',
    '    - fallback_trigger: string, max 120 chars',
    '- sprint_recommendation: an object with:',
    '    - duration_days: the integer 14 (must be exactly 14)',
    '    - daily_minutes_target: integer between 10 and 60',
    '    - emphasis: one of ["micro_proof","foundational_skills","schedule_stability"]',
    '- risk_flags: an array of 0 to 4 strings, each one of',
    '    ["low_schedule_stability","high_fatigue_pattern","directional_ambiguity","insufficient_skill_overlap"]',
    '- next_actions: an array of 2 or 3 short instruction strings.',
  ].join('\n'),

  professor_agent: [
    'Return a JSON object with EXACTLY these top-level keys (no more, no fewer):',
    '  agent, schema_version, session_objective, options, resistance_signal, escalation_recommendation, next_actions',
    '',
    'Rules:',
    '- agent: the string "professor_agent".',
    '- schema_version: the string "1.0.0".',
    '- session_objective: string, max 180 chars.',
    '- options: an array of 2 or 3 objects. Each object has:',
    '    - label: one of ["best_next","easier_fallback","catch_up"]',
    '    - task_summary: string, max 180 chars',
    '  At least one option should be proof-producing (best_next).',
    '- resistance_signal: one of ["none","topic_resistance","fatigue_friction","choice_overload"].',
    '- escalation_recommendation: one of ["none","career_coach_review","resilience_coach_review"].',
    '- next_actions: an array of EXACTLY 2 short instruction strings.',
    '  Write these as plain user-facing copy (e.g. "Try the easier fallback first if you feel stuck"). Do NOT use the raw enum names ("best_next","easier_fallback","catch_up") in the action text — those are internal labels, not words the learner should read.',
  ].join('\n'),

  career_coach_agent: [
    'Return a JSON object with EXACTLY these top-level keys (no more, no fewer):',
    '  agent, schema_version, recommendation_type, rationale_tag, pivot_options, preserved_progress_summary, next_actions',
    '',
    'Rules:',
    '- agent: the string "career_coach_agent".',
    '- schema_version: the string "1.0.0".',
    '- recommendation_type: one of ["stay_course","pivot_preview","pivot_candidate_requires_confirmation"].',
    '- rationale_tag: one of',
    '    ["high_overlap_preserved","directional_ambiguity_detected","interview_readiness_stall","market_gap_pressure"].',
    '- pivot_options: an array of 0 to 3 objects describing alternative paths.',
    '- preserved_progress_summary: string, max 220 chars.',
    '- next_actions: an array of EXACTLY 2 short instruction strings.',
  ].join('\n'),
};

/** Content rules every agent must obey (mirrors the guard's prohibited-content scan). */
export const CONTENT_RULES = [
  'Do NOT use therapy, diagnosis, medical, or crisis language anywhere in the output',
  '(no words like "diagnose", "disorder", "therapy", "depression", "trauma", "medication", etc.).',
  'Keep all guidance practical and execution-oriented.',
].join(' ');
