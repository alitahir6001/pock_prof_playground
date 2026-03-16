import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runAdaptationEvaluationCycle,
  type RunAdaptationEvaluationParams,
} from '../../src/modules/adaptation/phase3/adaptationEvaluationService.js';
import {
  AUDIT_PERSISTENCE_FAILED,
  type AdaptationEvaluationRecord,
  type AdaptationEvaluationRepository,
  type PersistenceTransaction,
  type TransactionFactory,
} from '../../src/modules/adaptation/phase3/adaptationEvaluationPersistence.js';
import { RULE_IDS } from '../../src/modules/adaptation/phase3/policyEngine.js';

function baseParams(overrides?: Partial<RunAdaptationEvaluationParams>): RunAdaptationEvaluationParams {
  const tx: PersistenceTransaction = {
    async commit() {},
    async rollback() {},
  };

  const txFactory: TransactionFactory = {
    async begin() {
      return tx;
    },
  };

  const repository: AdaptationEvaluationRepository = {
    async insertEvaluation() {
      return 'eval_service_1';
    },
  };

  return {
    policy_input: {
      user_id: 'u_service',
      evaluated_at: '2026-02-01T10:00:00.000Z',
      weekly_structural_mutations_applied: 0,
      counters: {
        missed_sessions_7d: 0,
        late_night_sessions_7d: 0,
        topic_resistance_triggered: false,
        pivot_interest_triggered: false,
        consecutive_completed_sessions: 0,
      },
    },
    trigger_window: '7d',
    previous_state: { difficulty: 1 },
    new_state: { difficulty: 1 },
    txFactory,
    repository,
    ...overrides,
  };
}

test('runs evaluate -> build record -> persist and returns evaluation id + policy output', async () => {
  const inserted: { record?: AdaptationEvaluationRecord } = {};

  const params = baseParams({
    policy_input: {
      ...baseParams().policy_input,
      counters: {
        ...baseParams().policy_input.counters,
        missed_sessions_7d: 2,
      },
    },
    repository: {
      async insertEvaluation(record) {
        inserted.record = record;
        return 'eval_service_2';
      },
    },
  });

  const result = await runAdaptationEvaluationCycle(params);

  assert.equal(result.evaluation_id, 'eval_service_2');
  assert.deepEqual(result.policy_output.applied_rules, [RULE_IDS.MISSED_2_IN_7D]);
  assert.equal(inserted.record?.user_id, 'u_service');
  assert.deepEqual(inserted.record?.applied_rule_ids_json, [RULE_IDS.MISSED_2_IN_7D]);
  assert.equal(inserted.record?.evaluation_time, '2026-02-01T10:00:00.000Z');
});

test('propagates fail-closed sentinel when structural mutation persistence fails', async () => {
  const tx: PersistenceTransaction = {
    async commit() {},
    async rollback() {},
  };

  const params = baseParams({
    policy_input: {
      ...baseParams().policy_input,
      counters: {
        ...baseParams().policy_input.counters,
        pivot_interest_triggered: true,
      },
    },
    txFactory: {
      async begin() {
        return tx;
      },
    },
    repository: {
      async insertEvaluation() {
        throw new Error('db write failed');
      },
    },
  });

  await assert.rejects(
    () => runAdaptationEvaluationCycle(params),
    /AUDIT_PERSISTENCE_FAILED/,
  );
});

test('rethrows original persistence error for non-structural-only failures', async () => {
  const tx: PersistenceTransaction = {
    async commit() {},
    async rollback() {},
  };

  const dbError = new Error('db timeout');

  const params = baseParams({
    policy_input: {
      ...baseParams().policy_input,
      counters: {
        ...baseParams().policy_input.counters,
        missed_sessions_7d: 2,
      },
    },
    txFactory: {
      async begin() {
        return tx;
      },
    },
    repository: {
      async insertEvaluation() {
        throw dbError;
      },
    },
  });

  await assert.rejects(
    () => runAdaptationEvaluationCycle(params),
    dbError,
  );
});

// compile-time assertion: imported sentinel exists and is stable constant
assert.equal(typeof AUDIT_PERSISTENCE_FAILED, 'string');
