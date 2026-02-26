import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePolicies, RULE_IDS } from '../../src/modules/adaptation/phase3/policyEngine.mjs';

function baseInput(overrides = {}) {
  return {
    user_id: 'u1',
    evaluated_at: '2026-01-20T12:00:00.000Z',
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

test('uses caller-supplied evaluated_at for deterministic output', () => {
  const out = evaluatePolicies(baseInput());
  assert.equal(out.evaluated_at, '2026-01-20T12:00:00.000Z');
});

test('applies missed sessions rule at threshold', () => {
  const out = evaluatePolicies(baseInput({
    counters: { missed_sessions_7d: 2 }
  }));

  assert.ok(out.applied_rules.includes(RULE_IDS.MISSED_2_IN_7D));
  const mutation = out.mutations.find((m) => m.rule_id === RULE_IDS.MISSED_2_IN_7D);
  assert.equal(mutation.mutation_applied.workload_delta_percent, -25);
});

test('applies late-night schedule shift at threshold', () => {
  const out = evaluatePolicies(baseInput({
    counters: { late_night_sessions_7d: 3 }
  }));

  assert.ok(out.applied_rules.includes(RULE_IDS.LATE_NIGHT_3));
});

test('applies coach escalation on topic resistance', () => {
  const out = evaluatePolicies(baseInput({
    counters: { topic_resistance_triggered: true }
  }));

  assert.ok(out.applied_rules.includes(RULE_IDS.TOPIC_RESISTANCE));
});

test('applies pivot recalculation on pivot interest', () => {
  const out = evaluatePolicies(baseInput({
    counters: { pivot_interest_triggered: true }
  }));

  assert.ok(out.applied_rules.includes(RULE_IDS.PIVOT_INTEREST));
});

test('applies slight difficulty increase after 5 completed sessions', () => {
  const out = evaluatePolicies(baseInput({
    counters: { consecutive_completed_sessions: 5 }
  }));

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

test('fails closed when evaluated_at is missing', () => {
  assert.throws(
    () => evaluatePolicies({ user_id: 'u1', counters: baseInput().counters }),
    /evaluated_at must be a valid ISO timestamp string/,
  );
});

test('fails closed when counters are invalid', () => {
  assert.throws(
    () => evaluatePolicies(baseInput({ counters: { late_night_sessions_7d: '3' } })),
    /Invalid numeric counter: late_night_sessions_7d/,
  );
});
