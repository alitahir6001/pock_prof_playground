import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPostgresPersistenceAdapter,
  PostgresAdaptationEvaluationRepository,
  PostgresPersistenceTransaction,
  PostgresTransactionFactory,
  type PostgresClientLike,
  type PostgresPoolLike,
} from '../../src/modules/adaptation/phase3/adaptationEvaluationPostgresAdapter.js';
import {
  AUDIT_PERSISTENCE_FAILED,
  persistAdaptationEvaluationOrThrow,
} from '../../src/modules/adaptation/phase3/adaptationEvaluationPersistence.js';

function baseRecord() {
  return {
    user_id: 'u_pg_1',
    evaluation_time: '2026-02-20T10:00:00.000Z',
    trigger_window: '7d',
    events_used_json: ['session_missed'],
    applied_rule_ids_json: ['R_MISSED_2_IN_7D_REDUCE_WORKLOAD_25'],
    mutations_json: [
      {
        rule_id: 'R_MISSED_2_IN_7D_REDUCE_WORKLOAD_25',
        trigger_window: '7d',
        events_used: ['session_missed'],
        mutation_applied: { type: 'workload_adjustment', workload_delta_percent: -25 },
      },
    ],
    previous_state_json: { workload: 100 },
    new_state_json: { workload: 75 },
    deferred_mutations_json: [],
  };
}

test('transaction factory opens BEGIN and commit closes with COMMIT + release', async () => {
  const calls: string[] = [];

  const client: PostgresClientLike = {
    async query(sql: string) {
      calls.push(sql.trim());
      return { rows: [] };
    },
    release() {
      calls.push('RELEASE');
    },
  };

  const pool: PostgresPoolLike = {
    async connect() {
      calls.push('CONNECT');
      return client;
    },
  };

  const txFactory = new PostgresTransactionFactory(pool);
  const tx = await txFactory.begin();
  await tx.commit();

  assert.deepEqual(calls, ['CONNECT', 'BEGIN', 'COMMIT', 'RELEASE']);
});

test('transaction rollback closes with ROLLBACK + release', async () => {
  const calls: string[] = [];

  const client: PostgresClientLike = {
    async query(sql: string) {
      calls.push(sql.trim());
      return { rows: [] };
    },
    release() {
      calls.push('RELEASE');
    },
  };

  const tx = new PostgresPersistenceTransaction(client);
  await tx.rollback();

  assert.deepEqual(calls, ['ROLLBACK', 'RELEASE']);
});

test('repository inserts evaluation row using active postgres transaction', async () => {
  let capturedSql = '';
  let capturedParams: unknown[] = [];

  const client: PostgresClientLike = {
    async query(sql: string, params?: unknown[]) {
      capturedSql = sql;
      capturedParams = params || [];
      return { rows: [{ evaluation_id: 'eval_from_db' }] };
    },
    release() {},
  };

  const tx = new PostgresPersistenceTransaction(client);
  const repository = new PostgresAdaptationEvaluationRepository();
  const out = await repository.insertEvaluation(baseRecord(), tx);

  assert.equal(out, 'eval_from_db');
  assert.equal(capturedSql.includes('INSERT INTO adaptation_evaluations'), true);
  assert.equal(capturedParams.length, 10);
});

test('adapter factory returns repository + txFactory that work with persistence helper', async () => {
  const calls: string[] = [];

  const client: PostgresClientLike = {
    async query(sql: string) {
      calls.push(sql.trim());
      return { rows: [] };
    },
    release() {
      calls.push('RELEASE');
    },
  };

  const pool: PostgresPoolLike = {
    async connect() {
      calls.push('CONNECT');
      return client;
    },
  };

  const { txFactory } = createPostgresPersistenceAdapter(pool);

  await assert.rejects(
    () =>
      persistAdaptationEvaluationOrThrow({
        record: baseRecord(),
        hasStructuralMutation: true,
        txFactory,
        repository: {
          async insertEvaluation() {
            throw new Error('db down');
          },
        },
      }),
    /AUDIT_PERSISTENCE_FAILED/,
  );

  assert.deepEqual(calls, ['CONNECT', 'BEGIN', 'ROLLBACK', 'RELEASE']);
  assert.equal(typeof AUDIT_PERSISTENCE_FAILED, 'string');
});
