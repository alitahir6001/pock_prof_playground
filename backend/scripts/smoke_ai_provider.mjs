/**
 * Live AI provider smoke test.
 *
 * Hits each configured provider with a tiny JSON prompt to verify:
 *   1. the API key works, and
 *   2. the resolved model name is valid (a wrong model name is the most
 *      common real-world failure).
 *
 * Run with real keys loaded from .env:
 *   npm run smoke:ai            # probe each provider on the fast tier
 *   AI_SMOKE_TIER=deep npm run smoke:ai
 *
 * Makes real, billable API calls (a few tokens each). Never run in CI without
 * intent. Exits non-zero if no provider answers.
 */
import {
  generateAgentJson,
  aiProviderConfigFromEnv,
  AI_PROVIDER_ORDER,
} from '../dist/src/modules/agents/phase2/ai/aiProviderService.js';

const tier = ['fast', 'mid', 'deep'].includes(process.env.AI_SMOKE_TIER)
  ? process.env.AI_SMOKE_TIER
  : 'fast';

const KEY_FIELD = {
  gemini: 'geminiApiKey',
  openai: 'openaiApiKey',
  anthropic: 'anthropicApiKey',
};

const request = {
  tier,
  systemPrompt:
    'You are a connectivity probe. Reply ONLY with strict JSON, no prose, no code fences.',
  userPrompt: 'Return exactly this JSON object and nothing else: {"pong": true}',
  // Roomy budget: "thinking" models (Gemini 3) spend tokens reasoning before
  // answering; too small a budget returns empty output.
  maxOutputTokens: 1024,
  validate: (json) =>
    json && typeof json === 'object' && json.pong === true
      ? { ok: true }
      : { ok: false, detail: `unexpected payload: ${JSON.stringify(json)}` },
};

const fullConfig = aiProviderConfigFromEnv();

console.log(`\n🔌 AI provider smoke test (tier: ${tier})\n`);

let anyKey = false;
let anySuccess = false;

// Probe each provider in isolation so we learn the health of EACH one
// (the chain alone would stop at the first success and hide the rest).
for (const provider of AI_PROVIDER_ORDER) {
  const keyField = KEY_FIELD[provider];
  if (!fullConfig[keyField]) {
    console.log(`  ⚪ ${provider.padEnd(10)} skipped (no API key)`);
    continue;
  }
  anyKey = true;

  // Isolate: a config with only this provider's key.
  const isolated = { [keyField]: fullConfig[keyField], modelOverrides: fullConfig.modelOverrides };

  const startedAt = Date.now();
  try {
    const result = await generateAgentJson(request, isolated);
    const ms = Date.now() - startedAt;
    anySuccess = true;
    console.log(`  ✅ ${provider.padEnd(10)} OK in ${ms}ms`);
  } catch (err) {
    const attempt = err?.attempts?.find((a) => a.provider === provider);
    const reason = attempt ? `${attempt.failureReason}: ${attempt.detail ?? ''}` : err?.message;
    console.log(`  ❌ ${provider.padEnd(10)} FAILED — ${reason}`);
  }
}

// One full-chain call to confirm end-to-end fallback resolution.
if (anyKey) {
  try {
    const chain = await generateAgentJson(request, fullConfig);
    console.log(`\n  🔗 full chain answered by: ${chain.provider}`);
  } catch (err) {
    console.log(`\n  🔗 full chain FAILED — ${err?.message}`);
  }
}

console.log('');
if (!anyKey) {
  console.error('No provider API keys configured in environment. Nothing to test.');
  process.exit(2);
}
if (!anySuccess) {
  console.error('Every configured provider failed. See reasons above.');
  process.exit(1);
}
console.log('Smoke test passed: at least one provider is reachable and returns valid JSON.\n');
