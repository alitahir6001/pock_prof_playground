/**
 * Deterministic Phase 3 adaptation evaluator.
 * Inputs are persisted-window counters + explicit evaluation timestamp only.
 */

export const RULE_IDS = {
  MISSED_2_IN_7D: 'R_MISSED_2_IN_7D_REDUCE_WORKLOAD_25',
  LATE_NIGHT_3: 'R_LATE_NIGHT_3_SHIFT_SCHEDULE',
  TOPIC_RESISTANCE: 'R_TOPIC_RESISTANCE_ESCALATE_CAREER_COACH',
  PIVOT_INTEREST: 'R_PIVOT_INTEREST_RECALCULATE_GRAPH',
  COMPLETED_5: 'R_COMPLETED_5_INCREASE_DIFFICULTY'
} as const;

export const STRUCTURAL_MUTATION_TYPES = new Set<string>([
  'curriculum_recalculation'
]);

export const MAX_STRUCTURAL_MUTATIONS_PER_WEEK = 1;
export const POLICY_ENGINE_VERSION = 'phase3_slice2_v1';

const PRIORITY_ORDER = [
  RULE_IDS.TOPIC_RESISTANCE,
  RULE_IDS.PIVOT_INTEREST,
  RULE_IDS.MISSED_2_IN_7D,
  RULE_IDS.LATE_NIGHT_3,
  RULE_IDS.COMPLETED_5
];

export type CounterInput = {
  missed_sessions_7d: number;
  late_night_sessions_7d: number;
  topic_resistance_triggered: boolean;
  pivot_interest_triggered: boolean;
  consecutive_completed_sessions: number;
};

export type PolicyInput = {
  user_id: string;
  evaluated_at: string;
  weekly_structural_mutations_applied: number;
  counters: CounterInput;
};

type Mutation = {
  rule_id: string;
  trigger_window: string;
  events_used: string[];
  mutation_applied: Record<string, unknown>;
  deferred_reason?: 'STRUCTURAL_CAP_REACHED';
};

export type PolicyOutput = {
  engine_version: string;
  evaluated_at: string;
  applied_rules: string[];
  mutations: Mutation[];
  deferred_mutations: Mutation[];
  structural_cap: {
    max_per_week: number;
    already_applied: number;
  };
};

function byPriority(a: Mutation, b: Mutation): number {
  return PRIORITY_ORDER.indexOf(a.rule_id as (typeof PRIORITY_ORDER)[number]) - PRIORITY_ORDER.indexOf(b.rule_id as (typeof PRIORITY_ORDER)[number]);
}

function assertFiniteNumber(value: unknown, fieldName: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric counter: ${fieldName}`);
  }
}

function isStructuralMutation(mutation: Mutation): boolean {
  return STRUCTURAL_MUTATION_TYPES.has(String(mutation.mutation_applied.type));
}

function validateInput(input: unknown): asserts input is PolicyInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Input is required.');
  }

  const candidate = input as Partial<PolicyInput>;

  if (typeof candidate.user_id !== 'string' || candidate.user_id.length < 1) {
    throw new Error('user_id is required.');
  }

  if (typeof candidate.evaluated_at !== 'string' || Number.isNaN(Date.parse(candidate.evaluated_at))) {
    throw new Error('evaluated_at must be a valid ISO timestamp string.');
  }

  if (typeof candidate.weekly_structural_mutations_applied !== 'number' || candidate.weekly_structural_mutations_applied < 0) {
    throw new Error('weekly_structural_mutations_applied must be a non-negative number.');
  }

  const c = candidate.counters;
  if (!c || typeof c !== 'object') {
    throw new Error('counters are required.');
  }

  assertFiniteNumber((c as CounterInput).missed_sessions_7d, 'missed_sessions_7d');
  assertFiniteNumber((c as CounterInput).late_night_sessions_7d, 'late_night_sessions_7d');
  assertFiniteNumber((c as CounterInput).consecutive_completed_sessions, 'consecutive_completed_sessions');

  if (typeof (c as CounterInput).topic_resistance_triggered !== 'boolean') {
    throw new Error('topic_resistance_triggered must be boolean.');
  }

  if (typeof (c as CounterInput).pivot_interest_triggered !== 'boolean') {
    throw new Error('pivot_interest_triggered must be boolean.');
  }
}

export function evaluatePolicies(input: unknown): PolicyOutput {
  validateInput(input);

  const c = input.counters;
  const candidates: Mutation[] = [];

  if (c.missed_sessions_7d >= 2) {
    candidates.push({
      rule_id: RULE_IDS.MISSED_2_IN_7D,
      trigger_window: '7d',
      events_used: ['session_missed'],
      mutation_applied: {
        type: 'workload_adjustment',
        workload_delta_percent: -25
      }
    });
  }

  if (c.late_night_sessions_7d >= 3) {
    candidates.push({
      rule_id: RULE_IDS.LATE_NIGHT_3,
      trigger_window: '7d',
      events_used: ['session_started'],
      mutation_applied: {
        type: 'schedule_shift_recommendation',
        reason: 'late_night_cluster'
      }
    });
  }

  if (c.topic_resistance_triggered) {
    candidates.push({
      rule_id: RULE_IDS.TOPIC_RESISTANCE,
      trigger_window: '21d',
      events_used: ['topic_resistance_flag'],
      mutation_applied: {
        type: 'agent_escalation',
        agent: 'career_coach_agent'
      }
    });
  }

  if (c.pivot_interest_triggered) {
    candidates.push({
      rule_id: RULE_IDS.PIVOT_INTEREST,
      trigger_window: '7d',
      events_used: ['pivot_interest'],
      mutation_applied: {
        type: 'curriculum_recalculation',
        preserve_overlap_clusters: true
      }
    });
  }

  if (c.consecutive_completed_sessions >= 5) {
    candidates.push({
      rule_id: RULE_IDS.COMPLETED_5,
      trigger_window: '7d',
      events_used: ['session_completed'],
      mutation_applied: {
        type: 'difficulty_adjustment',
        difficulty_delta: 1,
        adjustment_mode: 'slight'
      }
    });
  }

  candidates.sort(byPriority);

  let structuralRemaining = Math.max(
    0,
    MAX_STRUCTURAL_MUTATIONS_PER_WEEK - input.weekly_structural_mutations_applied,
  );

  const applied: Mutation[] = [];
  const deferred: Mutation[] = [];

  for (const candidate of candidates) {
    if (isStructuralMutation(candidate) && structuralRemaining <= 0) {
      deferred.push({
        ...candidate,
        deferred_reason: 'STRUCTURAL_CAP_REACHED'
      });
      continue;
    }

    applied.push(candidate);

    if (isStructuralMutation(candidate)) {
      structuralRemaining -= 1;
    }
  }

  return {
    engine_version: POLICY_ENGINE_VERSION,
    evaluated_at: input.evaluated_at,
    applied_rules: applied.map((x) => x.rule_id),
    mutations: applied,
    deferred_mutations: deferred,
    structural_cap: {
      max_per_week: MAX_STRUCTURAL_MUTATIONS_PER_WEEK,
      already_applied: input.weekly_structural_mutations_applied
    }
  };
}
