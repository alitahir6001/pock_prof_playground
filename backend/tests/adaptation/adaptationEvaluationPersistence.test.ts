import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIT_PERSISTENCE_FAILED,
  persistAdaptationEvaluationOrThrow,
  type AdaptationEvaluationRecord,
  type PersistenceTransaction,
  type TransactionFactory,
  type AdaptationEvaluationRepository,
} from '../../src/modules/adaptation/phase3/adaptationEvaluationPersistence.js';

function baseRecord(): AdaptationEvaluationRecord {
  return {
    user_id: 'u1',
    evaluation_time: '2026-01-20T12:00:00.000Z',
    trigger_window: '7d',
    events_used_json: ['missed_sessions_7d:2'],
    applied_rule_ids_json: ['MISSED_2_IN_7D'],
    mutations_json: [
      {
        rule_id: 'MISSED_2_IN_7D',
        trigger_window: '7d',
        events_used: ['missed_sessions_7d:2'],
        mutation_applied: { workload_delta_percent: -25 },
      },
    ],
    previous_state_json: { workload: 100 },
    new_state_json: { workload: 75 },
    deferred_mutations_json: [],
  };
}

function createHarness(opts?: {
  insertError?: Error;
  rollbackError?: Error;
}) {
  const calls = {
    begin: 0,
    insert: 0,
    commit: 0,
    rollback: 0,
  };

  const tx: PersistenceTransaction = {
    async commit() {
      calls.commit += 1;
    },
    async rollback() {
      calls.rollback += 1;
      if (opts?.rollbackError) {
        throw opts.rollbackError;
      }
    },
  };

  const txFactory: TransactionFactory = {
    async begin() {
      calls.begin += 1;
      return tx;
    },
  };

  const repository: AdaptationEvaluationRepository = {
    async insertEvaluation() {
      calls.insert += 1;
      if (opts?.insertError) {
        throw opts.insertError;
      }
      return 'eval_123';
    },
  };

  return { calls, txFactory, repository };
}

test('persists record in one transaction and commits on success', async () => {
  const harness = createHarness();

  const out = await persistAdaptationEvaluationOrThrow({
    record: baseRecord(),
    hasStructuralMutation: true,
    txFactory: harness.txFactory,
    repository: harness.repository,
  });

  assert.deepEqual(out, { evaluation_id: 'eval_123' });
  assert.deepEqual(harness.calls, {
    begin: 1,
    insert: 1,
    commit: 1,
    rollback: 0,
  });
});

test('fails closed for structural mutations when insert fails', async () => {
  const harness = createHarness({ insertError: new Error('db down') });

  await assert.rejects(
    () =>
      persistAdaptationEvaluationOrThrow({
        record: baseRecord(),
        hasStructuralMutation: true,
        txFactory: harness.txFactory,
        repository: harness.repository,
      }),
    (error: unknown) => {
      assert.equal(error instanceof Error, true);
      assert.equal((error as Error).message, AUDIT_PERSISTENCE_FAILED);
      return true;
    },
  );

  assert.deepEqual(harness.calls, {
    begin: 1,
    insert: 1,
    commit: 0,
    rollback: 1,
  });
});

test('rethrows original error for non-structural mutations when insert fails', async () => {
  const insertError = new Error('db timeout');
  const harness = createHarness({ insertError });

  await assert.rejects(
    () =>
      persistAdaptationEvaluationOrThrow({
        record: baseRecord(),
        hasStructuralMutation: false,
        txFactory: harness.txFactory,
        repository: harness.repository,
      }),
    insertError,
  );

  assert.deepEqual(harness.calls, {
    begin: 1,
    insert: 1,
    commit: 0,
    rollback: 1,
  });
});

test('still fails closed for structural mutations even if rollback also fails', async () => {
  const harness = createHarness({
    insertError: new Error('insert failed'),
    rollbackError: new Error('rollback failed'),
  });

  await assert.rejects(
    () =>
      persistAdaptationEvaluationOrThrow({
        record: baseRecord(),
        hasStructuralMutation: true,
        txFactory: harness.txFactory,
        repository: harness.repository,
      }),
    /AUDIT_PERSISTENCE_FAILED/,
  );

  assert.deepEqual(harness.calls, {
    begin: 1,
    insert: 1,
    commit: 0,
    rollback: 1,
  });
});
