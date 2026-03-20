import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  handleAdaptationEvaluationApiRequest,
  handleAdaptationEvaluationWorkerJob,
} from '../../src/modules/adaptation/phase3/adaptationEvaluationEntrypoints.js';
import type { PostgresPoolLike } from '../../src/modules/adaptation/phase3/adaptationEvaluationPostgresAdapter.js';

function baseRequest() {
  return {
    user_id: 'u_entry_1',
    evaluated_at: '2026-02-05T10:00:00.000Z',
    trigger_window: '7d',
    weekly_structural_mutations_applied: 0,
    counters: {
      missed_sessions_7d: 2,
      late_night_sessions_7d: 0,
      topic_resistance_triggered: false,
      pivot_interest_triggered: false,
      consecutive_completed_sessions: 0,
    },
    previous_state: { difficulty: 1 },
    new_state: { difficulty: 1, workload: 75 },
  };
}

test('API entrypoint executes evaluation cycle with file adapter', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pp-entry-api-'));

  try {
    const filePath = join(tempDir, 'adaptation-evals.json');
    const response = await handleAdaptationEvaluationApiRequest(baseRequest(), {
      auditFilePath: filePath,
    });

    assert.equal(response.ok, true);
    if (response.ok) {
      assert.equal(response.result.evaluation_id.startsWith('eval_'), true);
      assert.equal(response.result.policy_output.applied_rules.length, 1);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('API entrypoint executes evaluation cycle with postgres adapter when persistenceMode=postgres', async () => {
  const calls: string[] = [];
  const pool: PostgresPoolLike = {
    async connect() {
      calls.push('CONNECT');
      return {
        async query(sql: string) {
          calls.push(sql.trim().split(/\s+/)[0] || sql.trim());
          if (sql.includes('INSERT INTO adaptation_evaluations')) {
            return { rows: [{ evaluation_id: 'eval_pg_runtime' }] };
          }
          return { rows: [] };
        },
        release() {
          calls.push('RELEASE');
        },
      };
    },
  };

  const response = await handleAdaptationEvaluationApiRequest(baseRequest(), {
    persistenceMode: 'postgres',
    postgresPool: pool,
  });

  assert.equal(response.ok, true);
  if (response.ok) {
    assert.equal(response.result.evaluation_id, 'eval_pg_runtime');
    assert.equal(response.result.policy_output.applied_rules.length, 1);
  }
  assert.deepEqual(calls, ['CONNECT', 'BEGIN', 'INSERT', 'COMMIT', 'RELEASE']);
});

test('worker entrypoint returns deterministic job completion payload', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pp-entry-worker-'));

  try {
    const filePath = join(tempDir, 'adaptation-evals.json');
    const out = await handleAdaptationEvaluationWorkerJob({
      job_id: 'job_1',
      request: baseRequest(),
      auditFilePath: filePath,
    });

    assert.deepEqual(out, {
      job_id: 'job_1',
      status: 'completed',
      evaluation_id: out.evaluation_id,
      applied_rule_count: 1,
    });
    assert.equal(out.evaluation_id.startsWith('eval_'), true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('API entrypoint returns fail-closed error code for structural audit persistence failure', async () => {
  const response = await handleAdaptationEvaluationApiRequest(
    {
      ...baseRequest(),
      counters: {
        ...baseRequest().counters,
        pivot_interest_triggered: true,
      },
    },
    {
      txFactory: {
        async begin() {
          return {
            async commit() {},
            async rollback() {},
          };
        },
      },
      repository: {
        async insertEvaluation() {
          throw new Error('db down');
        },
      },
    },
  );

  assert.deepEqual(response, {
    ok: false,
    error_code: 'AUDIT_PERSISTENCE_FAILED',
    detail: 'Structural mutation blocked due to audit persistence failure.',
  });
});

test('entrypoint fails closed on invalid request shape', async () => {
  await assert.rejects(
    () => handleAdaptationEvaluationApiRequest({ user_id: 'u1' }, { auditFilePath: '/tmp/x.json' }),
    /evaluated_at must be valid ISO timestamp string/,
  );
});

test('entrypoint rejects postgres mode when no postgresPool is provided', async () => {
  await assert.rejects(
    () => handleAdaptationEvaluationApiRequest(baseRequest(), { persistenceMode: 'postgres' }),
    /postgresPool is required when persistenceMode is postgres/,
  );
});
