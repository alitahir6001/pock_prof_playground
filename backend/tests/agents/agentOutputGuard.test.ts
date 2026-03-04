import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAgentOutput } from '../../src/modules/agents/phase2/validation/agentOutputGuard.js';

const validOnboarding = {
  agent: 'onboarding_agent',
  schema_version: '1.0.0',
  career_options: [
    { path_id: 'it_support', title: 'IT Support Specialist', rank: 1, rationale_tag: 'fast_interview_path' },
    { path_id: 'qa', title: 'QA Analyst', rank: 2, rationale_tag: 'schedule_compatible' },
    { path_id: 'data', title: 'Junior Data Analyst', rank: 3, rationale_tag: 'high_overlap' }
  ],
  trigger_plan: {
    primary_trigger: 'After coffee',
    fallback_trigger: 'After shower'
  },
  sprint_recommendation: {
    duration_days: 14,
    daily_minutes_target: 20,
    emphasis: 'micro_proof'
  },
  risk_flags: ['low_schedule_stability'],
  next_actions: ['Confirm trigger windows.', 'Do one micro-proof.']
};

test('accepts valid onboarding payload', () => {
  const result = validateAgentOutput('onboarding_agent', validOnboarding);
  assert.equal(result.ok, true);
});

test('rejects payloads with unknown fields', () => {
  const payload = { ...validOnboarding, unexpected_field: 'boom' };
  const result = validateAgentOutput('onboarding_agent', payload);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, 'UNMAPPED_ACTION');
});

test('rejects invalid enum values', () => {
  const payload = {
    ...validOnboarding,
    career_options: [
      { ...validOnboarding.career_options[0], rationale_tag: 'anything_goes' },
      validOnboarding.career_options[1],
      validOnboarding.career_options[2],
    ]
  };
  const result = validateAgentOutput('onboarding_agent', payload);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, 'SCHEMA_VALIDATION_FAILED');
});

test('rejects oversized strings', () => {
  const payload = {
    ...validOnboarding,
    trigger_plan: {
      ...validOnboarding.trigger_plan,
      primary_trigger: 'x'.repeat(121),
    }
  };

  const result = validateAgentOutput('onboarding_agent', payload);
  assert.equal(result.ok, false);
});

test('rejects invalid cardinality for next_actions', () => {
  const payload = {
    ...validOnboarding,
    next_actions: ['only one']
  };

  const result = validateAgentOutput('onboarding_agent', payload);
  assert.equal(result.ok, false);
});

test('rejects prohibited content patterns', () => {
  const payload = {
    ...validOnboarding,
    next_actions: ['You may have a disorder and need therapy.', 'Do one micro-proof.']
  };

  const result = validateAgentOutput('onboarding_agent', payload);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, 'PROHIBITED_CONTENT');
});
