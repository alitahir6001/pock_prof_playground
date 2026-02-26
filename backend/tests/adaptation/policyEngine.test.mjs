import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluatePolicies,
  RULE_IDS,
  MAX_STRUCTURAL_MUTATIONS_PER_WEEK,
  POLICY_ENGINE_VERSION,
} from '../../src/modules/adaptation/phase3/policyEngine.mjs';
import { buildAdaptationEvaluationRecord } from '../../src/modules/adaptation/phase3/adaptationEvaluationRecord.mjs';

function baseInput(overrides = {}) {
  return {
    user_id: 'u1',
    evaluated_at: '2026-01-20T12:00:00.000Z',
    weekly_structural_mutations_applied: 0,
    counters: {
      missed_sessions_7d: 0,
      late_night_sessions_7d: 0,
      topic_resistance_triggered: false,
      pivot_interest_triggered: false,
      consecutive_completed_sessions: 0
    },
    ...overrides,
    counters: {
      missed_sessions_7d: 0,
      late_night_sessions_7d: 0,
      topic_resistance_triggered: false,
      pivot_interest_triggered: false,
      consecutive_completed_sessions: 0,
      ...(overrides.counters || {})
    }
  };
}


test('returns explicit engine version for audit traceability', () => {
  const out = evaluatePolicies(baseInput());
  assert.equal(out.engine_version, POLICY_ENGINE_VERSION);
});

test('uses caller-supplied evaluated_at for deterministic output', () => {
  const out = evaluatePolicies(baseInput());
  assert.equal(out.evaluated_at, '2026-01-20T12:00:00.000Z');
});

test('applies missed sessions rule at threshold', () => {
  const out = evaluatePolicies(baseInput({ counters: { missed_sessions_7d: 2 } }));
  assert.ok(out.applied_rules.includes(RULE_IDS.MISSED_2_IN_7D));
  const mutation = out.mutations.find((m) => m.rule_id === RULE_IDS.MISSED_2_IN_7D);
  assert.equal(mutation.mutation_applied.workload_delta_percent, -25);
});

test('applies late-night schedule shift at threshold', () => {
  const out = evaluatePolicies(baseInput({ counters: { late_night_sessions_7d: 3 } }));
  assert.ok(out.applied_rules.includes(RULE_IDS.LATE_NIGHT_3));
});

test('applies coach escalation on topic resistance', () => {
  const out = evaluatePolicies(baseInput({ counters: { topic_resistance_triggered: true } }));
  assert.ok(out.applied_rules.includes(RULE_IDS.TOPIC_RESISTANCE));
});

test('applies pivot recalculation on pivot interest', () => {
  const out = evaluatePolicies(baseInput({ counters: { pivot_interest_triggered: true } }));
  assert.ok(out.applied_rules.includes(RULE_IDS.PIVOT_INTEREST));
});

test('applies slight difficulty increase after 5 completed sessions', () => {
  const out = evaluatePolicies(baseInput({ counters: { consecutive_completed_sessions: 5 } }));
  assert.ok(out.applied_rules.includes(RULE_IDS.COMPLETED_5));
});

test('orders rules by deterministic priority', () => {
  const out = evaluatePolicies(baseInput({
    counters: {
      missed_sessions_7d: 3,
      late_night_sessions_7d: 4,
      topic_resistance_triggered: true,
      pivot_interest_triggered: true,
      consecutive_completed_sessions: 7
    }
  }));

  assert.deepEqual(out.applied_rules, [
    RULE_IDS.TOPIC_RESISTANCE,
    RULE_IDS.PIVOT_INTEREST,
    RULE_IDS.MISSED_2_IN_7D,
    RULE_IDS.LATE_NIGHT_3,
    RULE_IDS.COMPLETED_5
  ]);
});

test('enforces weekly structural mutation cap and defers excess structural actions', () => {
  const out = evaluatePolicies(baseInput({
    weekly_structural_mutations_applied: MAX_STRUCTURAL_MUTATIONS_PER_WEEK,
    counters: {
      pivot_interest_triggered: true,
      missed_sessions_7d: 2
    }
  }));

  assert.equal(out.mutations.some((m) => m.rule_id === RULE_IDS.PIVOT_INTEREST), false);
  assert.equal(out.deferred_mutations.some((m) => m.rule_id === RULE_IDS.PIVOT_INTEREST), true);
  assert.equal(out.applied_rules.includes(RULE_IDS.MISSED_2_IN_7D), true);
});

test('fails closed when evaluated_at is missing', () => {
  assert.throws(
    () => evaluatePolicies({ user_id: 'u1', weekly_structural_mutations_applied: 0, counters: baseInput().counters }),
    /evaluated_at must be a valid ISO timestamp string/,
  );
});

test('fails closed when counters are invalid', () => {
  assert.throws(
    () => evaluatePolicies(baseInput({ counters: { late_night_sessions_7d: '3' } })),
    /Invalid numeric counter: late_night_sessions_7d/,
  );
});

test('fails closed when weekly structural count is invalid', () => {
  assert.throws(
    () => evaluatePolicies(baseInput({ weekly_structural_mutations_applied: -1 })),
    /weekly_structural_mutations_applied must be a non-negative number/,
  );
});

test('builds adaptation evaluation record payload for persistence adapter', () => {
  const output = evaluatePolicies(baseInput({ counters: { missed_sessions_7d: 2 } }));

  const record = buildAdaptationEvaluationRecord({
    user_id: 'u1',
    evaluated_at: '2026-01-20T12:00:00.000Z',
    trigger_window: '7d',
    engine_output: output,
    previous_state: { difficulty: 1 },
    new_state: { difficulty: 1, workload_delta_percent: -25 }
  });

  assert.deepEqual(record.applied_rule_ids_json, [RULE_IDS.MISSED_2_IN_7D]);
  assert.equal(Array.isArray(record.events_used_json), true);
  assert.equal(record.trigger_window, '7d');
});
