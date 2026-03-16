import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  handleAdaptationHttpRoute,
  handleAdaptationWorkerMessage,
} from '../../src/modules/adaptation/phase3/adaptationFrameworkBindings.js';

function basePayload() {
  return {
    user_id: 'u_bind_1',
    evaluated_at: '2026-02-10T10:00:00.000Z',
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

test('HTTP binding returns 200 + payload on success', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pp-http-bind-'));

  try {
    const response = await handleAdaptationHttpRoute(
      { body: basePayload() },
      { auditFilePath: join(tempDir, 'audit.json') },
    );

    assert.equal(response.status, 200);
    assert.equal(response.json.ok, true);
    assert.equal(String(response.json.evaluation_id).startsWith('eval_'), true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('HTTP binding maps invalid request to 400 BAD_REQUEST', async () => {
  const response = await handleAdaptationHttpRoute(
    { body: { user_id: 'u1' } },
    { auditFilePath: '/tmp/unused.json' },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(response.json.error_code, 'BAD_REQUEST');
});

test('HTTP binding maps structural audit failure to 503', async () => {
  const response = await handleAdaptationHttpRoute(
    {
      body: {
        ...basePayload(),
        counters: {
          ...basePayload().counters,
          pivot_interest_triggered: true,
        },
      },
    },
    {
      txFactory: {
        async begin() {
          return { async commit() {}, async rollback() {} };
        },
      },
      repository: {
        async insertEvaluation() {
          throw new Error('db down');
        },
      },
    },
  );

  assert.equal(response.status, 503);
  assert.deepEqual(response.json.error_code, 'AUDIT_PERSISTENCE_FAILED');
});

test('worker binding returns completed message on success', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pp-worker-bind-'));

  try {
    const out = await handleAdaptationWorkerMessage(
      { job_id: 'job_bind_1', payload: basePayload() },
      { auditFilePath: join(tempDir, 'audit.json') },
    );

    assert.equal(out.status, 'completed');
    assert.equal(String(out.evaluation_id).startsWith('eval_'), true);
    assert.equal(out.applied_rule_count, 1);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('worker binding returns failed message on fail-closed structural error', async () => {
  const out = await handleAdaptationWorkerMessage(
    {
      job_id: 'job_bind_2',
      payload: {
        ...basePayload(),
        counters: {
          ...basePayload().counters,
          pivot_interest_triggered: true,
        },
      },
    },
    {
      txFactory: {
        async begin() {
          return { async commit() {}, async rollback() {} };
        },
      },
      repository: {
        async insertEvaluation() {
          throw new Error('db down');
        },
      },
    },
  );

  assert.deepEqual(out, {
    job_id: 'job_bind_2',
    status: 'failed',
    error_code: 'AUDIT_PERSISTENCE_FAILED',
  });
});
