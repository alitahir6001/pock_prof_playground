import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyAdaptationError } from '../../src/modules/adaptation/phase3/adaptationObservability.js';

test('classifyAdaptationError maps structural audit sentinel', () => {
  assert.equal(classifyAdaptationError(new Error('AUDIT_PERSISTENCE_FAILED')), 'AUDIT_PERSISTENCE_FAILURE');
});

test('classifyAdaptationError maps validation-like errors', () => {
  assert.equal(classifyAdaptationError(new Error('evaluated_at must be valid ISO timestamp string.')), 'VALIDATION_ERROR');
});

test('classifyAdaptationError maps configuration errors', () => {
  assert.equal(classifyAdaptationError(new Error('postgresPool is required when persistenceMode is postgres.')), 'CONFIGURATION_ERROR');
});

test('classifyAdaptationError falls back to unknown', () => {
  assert.equal(classifyAdaptationError(new Error('socket closed unexpectedly')), 'UNKNOWN_ERROR');
});
