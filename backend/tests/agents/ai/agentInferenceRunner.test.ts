import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runAgentInference,
  buildSystemPrompt,
  type AgentContract,
} from '../../../src/modules/agents/phase2/ai/agentInferenceRunner.js';
import type { AiProviderName } from '../../../src/modules/agents/phase2/ai/aiProviderService.js';

// A guard-valid onboarding payload (mirrors agentOutputGuard's accepted shape).
const validOnboarding = {
  agent: 'onboarding_agent',
  schema_version: '1.0.0',
  career_options: [
    { path_id: 'it_support', title: 'IT Support Specialist', rank: 1, rationale_tag: 'fast_interview_path' },
    { path_id: 'qa', title: 'QA Analyst', rank: 2, rationale_tag: 'schedule_compatible' },
    { path_id: 'data', title: 'Junior Data Analyst', rank: 3, rationale_tag: 'high_overlap' },
  ],
  trigger_plan: { primary_trigger: 'After coffee', fallback_trigger: 'After shower' },
  sprint_recommendation: { duration_days: 14, daily_minutes_target: 20, emphasis: 'micro_proof' },
  risk_flags: ['low_schedule_stability'],
  next_actions: ['Confirm trigger windows.', 'Do one micro-proof.'],
};

// Same shape but career_options length 0 -> guard rejects (SCHEMA_VALIDATION_FAILED).
const guardInvalidOnboarding = { ...validOnboarding, career_options: [] };

const contract: AgentContract = {
  soul: 'soul text',
  systemInstructions: 'instructions text',
  exampleOutput: validOnboarding,
};

// ── fake fetch (order: openai, gemini, anthropic) ────────────────────────────

function envelope(provider: AiProviderName, text: string): unknown {
  if (provider === 'gemini') return { candidates: [{ content: { parts: [{ text }] } }] };
  if (provider === 'openai') return { choices: [{ message: { content: text } }] };
  return { content: [{ type: 'text', text }] };
}

function providerOf(url: string): AiProviderName {
  if (url.includes('generativelanguage')) return 'gemini';
  if (url.includes('api.openai.com')) return 'openai';
  if (url.includes('api.anthropic.com')) return 'anthropic';
  throw new Error(`Unexpected URL: ${url}`);
}

function makeFetch(scripts: Partial<Record<AiProviderName, unknown>>): typeof fetch {
  return (async (url: string | URL | Request) => {
    const provider = providerOf(String(url));
    const payload = scripts[provider];
    if (payload === undefined) throw new Error(`No script for ${provider}`);
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return new Response(JSON.stringify(envelope(provider, text)), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
}

const baseParams = {
  agentType: 'onboarding_agent' as const,
  input: { current_job: 'bartender' },
  contract,
};

// ── tests ────────────────────────────────────────────────────────────────────

test('returns the live provider output when it passes the guard', async () => {
  const f = makeFetch({ openai: validOnboarding });
  const result = await runAgentInference({
    ...baseParams,
    config: { openaiApiKey: 'o-key', fetchImpl: f },
  });
  assert.equal(result.source, 'openai');
  assert.equal(result.usedFallback, false);
  assert.deepEqual(result.output, validOnboarding);
});

test('falls through to the next provider when the guard rejects the first', async () => {
  const f = makeFetch({ openai: guardInvalidOnboarding, gemini: validOnboarding });
  const result = await runAgentInference({
    ...baseParams,
    config: { openaiApiKey: 'o-key', geminiApiKey: 'g-key', fetchImpl: f },
  });
  assert.equal(result.source, 'gemini');
  assert.equal(result.usedFallback, false);
  const openaiAttempt = result.attempts.find((a) => a.provider === 'openai');
  assert.equal(openaiAttempt?.failureReason, 'validation_failed');
});

test('returns the example output as fallback when every provider fails', async () => {
  const f = makeFetch({}); // no scripts; no keys -> providers all skipped
  const result = await runAgentInference({
    ...baseParams,
    config: { fetchImpl: f },
  });
  assert.equal(result.usedFallback, true);
  assert.equal(result.source, 'fallback_example');
  assert.deepEqual(result.output, validOnboarding);
});

test('system prompt embeds the strict contract, content rules, and example', () => {
  const prompt = buildSystemPrompt('onboarding_agent', contract);
  assert.ok(prompt.includes('SINGLE JSON object'));
  assert.ok(prompt.includes('STRICT OUTPUT CONTRACT'));
  // schema-spec specifics that the example alone would not convey
  assert.ok(prompt.includes('career_options: an array of EXACTLY 3 objects'));
  assert.ok(prompt.includes('fast_interview_path'));
  assert.ok(prompt.includes('therapy, diagnosis, medical')); // content rules
  assert.ok(prompt.includes('"agent": "onboarding_agent"')); // example
  assert.ok(prompt.includes('soul text'));
  assert.ok(prompt.includes('instructions text'));
});
