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

test('allows technical diagnose/prescribe vocabulary (IT support domain)', () => {
  const technicalPhrases = [
    'Diagnose a basic network issue and submit your fix notes.',
    'Run diagnostics on the failing service and note the error.',
    'Follow the prescribed troubleshooting checklist for the outage.',
  ];

  for (const phrase of technicalPhrases) {
    const payload = { ...validOnboarding, next_actions: [phrase, 'Do one micro-proof.'] };
    const result = validateAgentOutput('onboarding_agent', payload);
    assert.equal(result.ok, true);
  }
});

test('still rejects medical diagnosis framing (diagnose + condition term)', () => {
  const medicalPhrases = [
    'This may be diagnosed as anxiety, so rest first.', // "anxiety" alone is not blocked; the collocation is
    'A coach might diagnose you with a mental illness.',
    'You should self-diagnose before the next session.',
  ];

  for (const phrase of medicalPhrases) {
    const payload = { ...validOnboarding, next_actions: [phrase, 'Do one micro-proof.'] };
    const result = validateAgentOutput('onboarding_agent', payload);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, 'PROHIBITED_CONTENT');
  }
});

test('rejects non-obvious clinical framing language variants', () => {
  const variants = [
    'This sounds like a clinical condition that may need medical intervention.',
    'Please speak to a psychiatrist so they can evaluate medication options.',
    'Your stress pattern resembles a trauma response and could be PTSD related.',
  ];

  for (const phrase of variants) {
    const payload = {
      ...validOnboarding,
      next_actions: [phrase, 'Do one micro-proof.']
    };

    const result = validateAgentOutput('onboarding_agent', payload);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, 'PROHIBITED_CONTENT');
  }
});

const validProfessor = {
  agent: 'professor_agent',
  schema_version: '1.0.0',
  session_objective: 'Trace one failed connection from cable to gateway.',
  options: [
    { label: 'best_next', task_summary: 'Run ping and tracert to the gateway and note where it stops.' },
    { label: 'easier_fallback', task_summary: 'Label the four steps of a connection check on a diagram.' }
  ],
  resistance_signal: 'none',
  escalation_recommendation: 'none',
  next_actions: ['Pick one option.', 'Write down what you saw.']
};

test('professor: recall_note is optional, and may be null or a short string', () => {
  assert.equal(validateAgentOutput('professor_agent', validProfessor).ok, true);
  assert.equal(validateAgentOutput('professor_agent', { ...validProfessor, recall_note: null }).ok, true);
  const withNote = { ...validProfessor, recall_note: 'Four days ago you found the default gateway; today builds on that.' };
  assert.equal(validateAgentOutput('professor_agent', withNote).ok, true);
});

test('professor: rejects a recall_note that is too long or not a string', () => {
  assert.equal(validateAgentOutput('professor_agent', { ...validProfessor, recall_note: 'x'.repeat(181) }).ok, false);
  assert.equal(validateAgentOutput('professor_agent', { ...validProfessor, recall_note: 42 }).ok, false);
});
