import test from 'node:test';
import assert from 'node:assert/strict';
import { processBrokerBatch, type BrokerEnvelope } from '../../src/modules/adaptation/phase3/adaptationBrokerWorker.js';

function baseEnvelope(overrides: Partial<BrokerEnvelope> = {}): BrokerEnvelope {
  return {
    message_id: 'm1',
    attempt: 1,
    max_attempts: 3,
    worker_message: {
      job_id: 'job_1',
      payload: {},
    },
    ...overrides,
  };
}

test('processBrokerBatch counts completed messages', async () => {
  const out = await processBrokerBatch({
    messages: [baseEnvelope()],
    async processWorker() {
      return { status: 'completed' };
    },
  });

  assert.equal(out.telemetry.broker_messages_total, 1);
  assert.equal(out.telemetry.broker_messages_completed, 1);
  assert.equal(out.retry_queue.length, 0);
  assert.equal(out.dead_letter_queue.length, 0);
});

test('processBrokerBatch requeues retryable failures', async () => {
  const out = await processBrokerBatch({
    messages: [baseEnvelope()],
    async processWorker() {
      return { status: 'failed', error_code: 'db timeout', diagnostic_code: 'UNKNOWN_ERROR' };
    },
  });

  assert.equal(out.retry_queue.length, 1);
  assert.equal(out.retry_queue[0]?.attempt, 2);
  assert.equal(out.telemetry.broker_messages_retried, 1);
});

test('processBrokerBatch dead-letters non-retryable failures', async () => {
  const out = await processBrokerBatch({
    messages: [baseEnvelope()],
    async processWorker() {
      return {
        status: 'failed',
        error_code: 'evaluated_at must be valid ISO timestamp string.',
        diagnostic_code: 'VALIDATION_ERROR',
      };
    },
  });

  assert.equal(out.retry_queue.length, 0);
  assert.equal(out.dead_letter_queue.length, 1);
  assert.equal(out.telemetry.broker_messages_dead_lettered, 1);
});

test('processBrokerBatch dead-letters max-attempt failures', async () => {
  const out = await processBrokerBatch({
    messages: [baseEnvelope({ attempt: 3, max_attempts: 3 })],
    async processWorker() {
      return { status: 'failed', error_code: 'db timeout', diagnostic_code: 'UNKNOWN_ERROR' };
    },
  });

  assert.equal(out.retry_queue.length, 0);
  assert.equal(out.dead_letter_queue.length, 1);
  assert.equal(out.telemetry.broker_messages_dead_lettered, 1);
});
