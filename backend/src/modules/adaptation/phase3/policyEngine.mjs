/**
 * Deterministic Phase 3 adaptation evaluator.
 * Inputs are persisted-window counters + explicit evaluation timestamp only.
 */

export const RULE_IDS = {
  MISSED_2_IN_7D: "R_MISSED_2_IN_7D_REDUCE_WORKLOAD_25",
  LATE_NIGHT_3: "R_LATE_NIGHT_3_SHIFT_SCHEDULE",
  TOPIC_RESISTANCE: "R_TOPIC_RESISTANCE_ESCALATE_CAREER_COACH",
  PIVOT_INTEREST: "R_PIVOT_INTEREST_RECALCULATE_GRAPH",
  COMPLETED_5: "R_COMPLETED_5_INCREASE_DIFFICULTY"
};

const PRIORITY_ORDER = [
  RULE_IDS.TOPIC_RESISTANCE,
  RULE_IDS.PIVOT_INTEREST,
  RULE_IDS.MISSED_2_IN_7D,
  RULE_IDS.LATE_NIGHT_3,
  RULE_IDS.COMPLETED_5
];

function byPriority(a, b) {
  return PRIORITY_ORDER.indexOf(a.rule_id) - PRIORITY_ORDER.indexOf(b.rule_id);
}

function assertFiniteNumber(value, fieldName) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric counter: ${fieldName}`);
  }
}

function validateInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Input is required.');
  }

  if (typeof input.user_id !== 'string' || input.user_id.length < 1) {
    throw new Error('user_id is required.');
  }

  if (typeof input.evaluated_at !== 'string' || Number.isNaN(Date.parse(input.evaluated_at))) {
    throw new Error('evaluated_at must be a valid ISO timestamp string.');
  }

  const c = input.counters;
  if (!c || typeof c !== 'object') {
    throw new Error('counters are required.');
  }

  assertFiniteNumber(c.missed_sessions_7d, 'missed_sessions_7d');
  assertFiniteNumber(c.late_night_sessions_7d, 'late_night_sessions_7d');
  assertFiniteNumber(c.consecutive_completed_sessions, 'consecutive_completed_sessions');

  if (typeof c.topic_resistance_triggered !== 'boolean') {
    throw new Error('topic_resistance_triggered must be boolean.');
  }

  if (typeof c.pivot_interest_triggered !== 'boolean') {
    throw new Error('pivot_interest_triggered must be boolean.');
  }
}

/**
 * @param {object} input
 * @param {string} input.user_id
 * @param {string} input.evaluated_at
 * @param {object} input.counters
 * @param {number} input.counters.missed_sessions_7d
 * @param {number} input.counters.late_night_sessions_7d
 * @param {boolean} input.counters.topic_resistance_triggered
 * @param {boolean} input.counters.pivot_interest_triggered
 * @param {number} input.counters.consecutive_completed_sessions
 * @returns {{evaluated_at:string,applied_rules:Array,mutations:Array}}
 */
export function evaluatePolicies(input) {
  validateInput(input);

  const c = input.counters;
  const applied = [];

  if (c.missed_sessions_7d >= 2) {
    applied.push({
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
    applied.push({
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
    applied.push({
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
    applied.push({
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
    applied.push({
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

  applied.sort(byPriority);

  return {
    evaluated_at: input.evaluated_at,
    applied_rules: applied.map((x) => x.rule_id),
    mutations: applied
  };
}
