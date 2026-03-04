export type AgentType = 'onboarding_agent' | 'professor_agent' | 'career_coach_agent';

export type RejectReason =
  | 'SCHEMA_VALIDATION_FAILED'
  | 'UNMAPPED_ACTION'
  | 'PROHIBITED_CONTENT';

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: RejectReason; detail: string };

const PROHIBITED_LANGUAGE = [
  /diagnos/i,
  /disorder/i,
  /therapy/i,
  /mental health/i,
  /hopeless/i,
  /panic attack/i
];

const onboardingRationale = new Set([
  'high_overlap',
  'fast_interview_path',
  'schedule_compatible',
  'entry_level_accessible'
]);

const onboardingRiskFlags = new Set([
  'low_schedule_stability',
  'high_fatigue_pattern',
  'directional_ambiguity',
  'insufficient_skill_overlap'
]);

const professorLabels = new Set(['best_next', 'easier_fallback', 'catch_up']);
const professorResistance = new Set(['none', 'topic_resistance', 'fatigue_friction', 'choice_overload']);
const professorEscalation = new Set(['none', 'career_coach_review', 'resilience_coach_review']);

const coachRecommendation = new Set(['stay_course', 'pivot_preview', 'pivot_candidate_requires_confirmation']);
const coachRationale = new Set([
  'high_overlap_preserved',
  'directional_ambiguity_detected',
  'interview_readiness_stall',
  'market_gap_pressure'
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function hasOnlyKeys(obj: Record<string, unknown>, allowed: string[]): boolean {
  const keys = Object.keys(obj);
  return keys.every((k) => allowed.includes(k));
}

function scanProhibitedContent(value: unknown): boolean {
  if (typeof value === 'string') {
    return PROHIBITED_LANGUAGE.some((r) => r.test(value));
  }

  if (Array.isArray(value)) {
    return value.some((v) => scanProhibitedContent(v));
  }

  if (isRecord(value)) {
    return Object.values(value).some((v) => scanProhibitedContent(v));
  }

  return false;
}

function fail(detail: string, reason: RejectReason = 'SCHEMA_VALIDATION_FAILED'): GuardResult {
  return { ok: false, reason, detail };
}

function validateOnboarding(payload: Record<string, unknown>): GuardResult {
  const allowed = [
    'agent',
    'schema_version',
    'career_options',
    'trigger_plan',
    'sprint_recommendation',
    'risk_flags',
    'next_actions'
  ];

  if (!hasOnlyKeys(payload, allowed)) return fail('onboarding payload contains unknown fields', 'UNMAPPED_ACTION');
  if (payload.agent !== 'onboarding_agent') return fail('agent literal mismatch');
  if (payload.schema_version !== '1.0.0') return fail('schema_version mismatch');

  if (!Array.isArray(payload.career_options) || payload.career_options.length !== 3) return fail('career_options length must be 3');
  for (const option of payload.career_options) {
    if (!isRecord(option)) return fail('career option must be object');
    if (![1, 2, 3].includes(Number(option.rank))) return fail('career option rank must be 1..3');
    if (typeof option.title !== 'string' || option.title.length < 1) return fail('career option title invalid');
    if (!onboardingRationale.has(String(option.rationale_tag))) return fail('invalid onboarding rationale_tag');
  }

  if (!isRecord(payload.trigger_plan)) return fail('trigger_plan invalid');
  const tp = payload.trigger_plan as Record<string, unknown>;
  if (typeof tp.primary_trigger !== 'string' || tp.primary_trigger.length > 120) return fail('primary_trigger invalid');
  if (typeof tp.fallback_trigger !== 'string' || tp.fallback_trigger.length > 120) return fail('fallback_trigger invalid');

  if (!isRecord(payload.sprint_recommendation)) return fail('sprint_recommendation invalid');
  const sr = payload.sprint_recommendation as Record<string, unknown>;
  if (sr.duration_days !== 14) return fail('duration_days must be 14');

  if (!Array.isArray(payload.risk_flags) || payload.risk_flags.length > 4) return fail('risk_flags invalid');
  for (const r of payload.risk_flags) {
    if (!onboardingRiskFlags.has(String(r))) return fail('invalid risk flag');
  }

  if (!Array.isArray(payload.next_actions) || payload.next_actions.length < 2 || payload.next_actions.length > 3) {
    return fail('next_actions count invalid');
  }

  return { ok: true };
}

function validateProfessor(payload: Record<string, unknown>): GuardResult {
  const allowed = [
    'agent',
    'schema_version',
    'session_objective',
    'options',
    'resistance_signal',
    'escalation_recommendation',
    'next_actions'
  ];

  if (!hasOnlyKeys(payload, allowed)) return fail('professor payload contains unknown fields', 'UNMAPPED_ACTION');
  if (payload.agent !== 'professor_agent') return fail('agent literal mismatch');
  if (payload.schema_version !== '1.0.0') return fail('schema_version mismatch');
  if (typeof payload.session_objective !== 'string' || payload.session_objective.length > 180) return fail('session_objective invalid');

  if (!Array.isArray(payload.options) || payload.options.length < 2 || payload.options.length > 3) return fail('options count invalid');
  for (const op of payload.options) {
    if (!isRecord(op)) return fail('option must be object');
    if (!professorLabels.has(String(op.label))) return fail('invalid option label');
    if (typeof op.task_summary !== 'string' || op.task_summary.length > 180) return fail('task_summary invalid');
  }

  if (!professorResistance.has(String(payload.resistance_signal))) return fail('invalid resistance_signal');
  if (!professorEscalation.has(String(payload.escalation_recommendation))) return fail('invalid escalation_recommendation');

  if (!Array.isArray(payload.next_actions) || payload.next_actions.length !== 2) return fail('next_actions must be length 2');

  return { ok: true };
}

function validateCareerCoach(payload: Record<string, unknown>): GuardResult {
  const allowed = [
    'agent',
    'schema_version',
    'recommendation_type',
    'rationale_tag',
    'pivot_options',
    'preserved_progress_summary',
    'next_actions'
  ];

  if (!hasOnlyKeys(payload, allowed)) return fail('career_coach payload contains unknown fields', 'UNMAPPED_ACTION');
  if (payload.agent !== 'career_coach_agent') return fail('agent literal mismatch');
  if (payload.schema_version !== '1.0.0') return fail('schema_version mismatch');
  if (!coachRecommendation.has(String(payload.recommendation_type))) return fail('invalid recommendation_type');
  if (!coachRationale.has(String(payload.rationale_tag))) return fail('invalid rationale_tag');

  if (!Array.isArray(payload.pivot_options) || payload.pivot_options.length > 3) return fail('pivot_options invalid');
  if (typeof payload.preserved_progress_summary !== 'string' || payload.preserved_progress_summary.length > 220) {
    return fail('preserved_progress_summary invalid');
  }

  if (!Array.isArray(payload.next_actions) || payload.next_actions.length !== 2) return fail('next_actions must be length 2');

  return { ok: true };
}

export function validateAgentOutput(agent: AgentType, payload: unknown): GuardResult {
  if (!isRecord(payload)) return fail('payload must be object');

  if (scanProhibitedContent(payload)) {
    return fail('payload contains prohibited language patterns', 'PROHIBITED_CONTENT');
  }

  if (agent === 'onboarding_agent') return validateOnboarding(payload);
  if (agent === 'professor_agent') return validateProfessor(payload);
  return validateCareerCoach(payload);
}
