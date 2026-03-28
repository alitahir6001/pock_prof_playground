import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRetryDirective } from '../../src/modules/adaptation/phase3/adaptationWorkerRetryPolicy.js';

test('resolveRetryDirective marks validation error as non-retryable', () => {
  const out = resolveRetryDirective({
    attempt: 1,
    max_attempts: 3,
    diagnostic_code: 'VALIDATION_ERROR',
  });

  assert.deepEqual(out, {
    retryable: false,
    next_attempt: null,
    reason: 'NON_RETRYABLE_DIAGNOSTIC',
  });
});

test('resolveRetryDirective marks configuration error as non-retryable', () => {
  const out = resolveRetryDirective({
    attempt: 1,
    max_attempts: 3,
    diagnostic_code: 'CONFIGURATION_ERROR',
  });

  assert.deepEqual(out, {
    retryable: false,
    next_attempt: null,
    reason: 'NON_RETRYABLE_DIAGNOSTIC',
  });
});

test('resolveRetryDirective marks audit persistence failure as retryable under max attempts', () => {
  const out = resolveRetryDirective({
    attempt: 1,
    max_attempts: 3,
    diagnostic_code: 'AUDIT_PERSISTENCE_FAILURE',
  });

  assert.deepEqual(out, {
    retryable: true,
    next_attempt: 2,
    reason: 'RETRYABLE_FAILURE',
  });
});

test('resolveRetryDirective marks unknown failure as retryable under max attempts', () => {
  const out = resolveRetryDirective({
    attempt: 2,
    max_attempts: 4,
    diagnostic_code: 'UNKNOWN_ERROR',
  });

  assert.deepEqual(out, {
    retryable: true,
    next_attempt: 3,
    reason: 'RETRYABLE_FAILURE',
  });
});

test('resolveRetryDirective stops retry when max attempts reached', () => {
  const out = resolveRetryDirective({
    attempt: 3,
    max_attempts: 3,
    diagnostic_code: 'UNKNOWN_ERROR',
  });

  assert.deepEqual(out, {
    retryable: false,
    next_attempt: null,
    reason: 'MAX_ATTEMPTS_REACHED',
  });
});
