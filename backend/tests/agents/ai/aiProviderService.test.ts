import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAgentJson,
  extractJson,
  AiAllProvidersFailedError,
  type AiProviderName,
} from '../../../src/modules/agents/phase2/ai/aiProviderService.js';

// ── fake fetch ──────────────────────────────────────────────────────────────

type ProviderScript = {
  status?: number;
  /** Text content the provider "returned"; wrapped in the provider's envelope. */
  text?: string;
  /** Throw instead of responding (network error / abort simulation). */
  throws?: Error;
  /** Raw JSON body override (bypasses envelope wrapping). */
  rawBody?: unknown;
};

function providerOf(url: string): AiProviderName {
  if (url.includes('generativelanguage')) return 'gemini';
  if (url.includes('api.openai.com')) return 'openai';
  if (url.includes('api.anthropic.com')) return 'anthropic';
  throw new Error(`Unexpected URL: ${url}`);
}

function envelope(provider: AiProviderName, text: string): unknown {
  if (provider === 'gemini') {
    return { candidates: [{ content: { parts: [{ text }] } }] };
  }
  if (provider === 'openai') {
    return { choices: [{ message: { content: text } }] };
  }
  return { content: [{ type: 'text', text }] };
}

interface CapturedRequest {
  provider: AiProviderName;
  url: string;
  body: Record<string, unknown>;
}

function makeFetch(scripts: Partial<Record<AiProviderName, ProviderScript>>): typeof fetch {
  const calls: AiProviderName[] = [];
  const requests: CapturedRequest[] = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    const provider = providerOf(u);
    calls.push(provider);
    requests.push({
      provider,
      url: u,
      body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {},
    });
    const script = scripts[provider];
    if (!script) throw new Error(`No script for ${provider}`);
    if (script.throws) throw script.throws;
    const status = script.status ?? 200;
    const body = script.rawBody ?? envelope(provider, script.text ?? '');
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  (impl as unknown as { calls: AiProviderName[]; requests: CapturedRequest[] }).calls = calls;
  (impl as unknown as { requests: CapturedRequest[] }).requests = requests;
  return impl;
}

function callsOf(f: typeof fetch): AiProviderName[] {
  return (f as unknown as { calls: AiProviderName[] }).calls;
}

function requestsOf(f: typeof fetch): CapturedRequest[] {
  return (f as unknown as { requests: CapturedRequest[] }).requests;
}

const allKeys = {
  geminiApiKey: 'g-key',
  openaiApiKey: 'o-key',
  anthropicApiKey: 'a-key',
};

const baseRequest = { systemPrompt: 'sys', userPrompt: 'user' };

// ── extractJson ───────────────────────────────────────────────────────────

test('extractJson parses plain JSON', () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
});

test('extractJson strips markdown code fences', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('```\n{"a":2}\n```'), { a: 2 });
});

test('extractJson recovers JSON from surrounding prose', () => {
  assert.deepEqual(extractJson('Sure! Here you go: {"a":1} hope that helps'), { a: 1 });
});

test('extractJson handles braces inside strings', () => {
  assert.deepEqual(extractJson('{"note":"a } brace"}'), { note: 'a } brace' });
});

test('extractJson throws when no JSON present', () => {
  assert.throws(() => extractJson('no json here'));
});

// ── provider selection / fallback ───────────────────────────────────────────

test('uses the first provider (openai) when it succeeds', async () => {
  const f = makeFetch({ openai: { text: '{"ok":1}' } });
  const result = await generateAgentJson(baseRequest, { ...allKeys, fetchImpl: f });
  assert.equal(result.provider, 'openai');
  assert.deepEqual(result.json, { ok: 1 });
  assert.deepEqual(callsOf(f), ['openai']);
});

test('falls through to gemini when openai returns an HTTP error', async () => {
  const f = makeFetch({
    openai: { status: 503, rawBody: { error: 'overloaded' } },
    gemini: { text: '{"ok":2}' },
  });
  const result = await generateAgentJson(baseRequest, { ...allKeys, fetchImpl: f });
  assert.equal(result.provider, 'gemini');
  assert.deepEqual(result.json, { ok: 2 });
  assert.deepEqual(callsOf(f), ['openai', 'gemini']);
  const openaiAttempt = result.attempts.find((a) => a.provider === 'openai');
  assert.equal(openaiAttempt?.failureReason, 'http_error');
});

test('falls through when a provider returns unparseable output', async () => {
  const f = makeFetch({
    openai: { text: 'totally not json' },
    gemini: { text: '{"ok":3}' },
  });
  const result = await generateAgentJson(baseRequest, { ...allKeys, fetchImpl: f });
  assert.equal(result.provider, 'gemini');
  const openaiAttempt = result.attempts.find((a) => a.provider === 'openai');
  assert.equal(openaiAttempt?.failureReason, 'json_parse_failed');
});

test('falls through when validation rejects a parseable response', async () => {
  const f = makeFetch({
    openai: { text: '{"agent":"wrong"}' },
    gemini: { text: '{"agent":"right"}' },
  });
  const result = await generateAgentJson(
    {
      ...baseRequest,
      validate: (json) =>
        (json as { agent?: string }).agent === 'right'
          ? { ok: true }
          : { ok: false, detail: 'agent mismatch' },
    },
    { ...allKeys, fetchImpl: f },
  );
  assert.equal(result.provider, 'gemini');
  const openaiAttempt = result.attempts.find((a) => a.provider === 'openai');
  assert.equal(openaiAttempt?.failureReason, 'validation_failed');
  assert.equal(openaiAttempt?.detail, 'agent mismatch');
});

test('skips providers without an API key', async () => {
  const f = makeFetch({ anthropic: { text: '{"ok":4}' } });
  const result = await generateAgentJson(baseRequest, {
    anthropicApiKey: 'a-key',
    fetchImpl: f,
  });
  assert.equal(result.provider, 'anthropic');
  // gemini + openai skipped without a network call
  assert.deepEqual(callsOf(f), ['anthropic']);
  const skipped = result.attempts.filter((a) => a.failureReason === 'no_api_key');
  assert.equal(skipped.length, 2);
});

test('throws AiAllProvidersFailedError when every provider fails', async () => {
  const f = makeFetch({
    gemini: { throws: Object.assign(new Error('boom'), { name: 'AbortError' }) },
    openai: { status: 500, rawBody: {} },
    anthropic: { text: 'nope' },
  });
  await assert.rejects(
    () => generateAgentJson(baseRequest, { ...allKeys, fetchImpl: f }),
    (err: unknown) => {
      if (!(err instanceof AiAllProvidersFailedError)) return false;
      assert.equal(err.attempts.length, 3);
      // order: openai, gemini, anthropic
      assert.equal(err.attempts[0].failureReason, 'http_error'); // openai 500
      assert.equal(err.attempts[1].failureReason, 'timeout'); // gemini abort
      assert.equal(err.attempts[2].failureReason, 'json_parse_failed'); // anthropic 'nope'
      return true;
    },
  );
});

// ── model tiers ─────────────────────────────────────────────────────────────

test('default tier (mid) selects the mid model; openai puts model in body', async () => {
  const f = makeFetch({ openai: { text: '{"ok":1}' } });
  await generateAgentJson(baseRequest, { openaiApiKey: 'o-key', fetchImpl: f });
  assert.equal(requestsOf(f)[0].body.model, 'gpt-5.4-2026-03-05'); // DEFAULT_MODELS.openai.mid
});

test('fast tier selects the fast model', async () => {
  const f = makeFetch({ openai: { text: '{"ok":1}' } });
  await generateAgentJson({ ...baseRequest, tier: 'fast' }, { openaiApiKey: 'o-key', fetchImpl: f });
  assert.equal(requestsOf(f)[0].body.model, 'gpt-5.4-mini-2026-03-17'); // DEFAULT_MODELS.openai.fast
});

test('deep tier selects the deep model', async () => {
  const f = makeFetch({ openai: { text: '{"ok":1}' } });
  await generateAgentJson({ ...baseRequest, tier: 'deep' }, { openaiApiKey: 'o-key', fetchImpl: f });
  assert.equal(requestsOf(f)[0].body.model, 'gpt-5.5-2026-04-23'); // DEFAULT_MODELS.openai.deep
});

test('gemini encodes the tier model into the URL', async () => {
  const f = makeFetch({ gemini: { text: '{"ok":1}' } });
  await generateAgentJson({ ...baseRequest, tier: 'fast' }, { geminiApiKey: 'g-key', fetchImpl: f });
  assert.ok(/models\/gemini-3\.5-flash:generateContent/.test(requestsOf(f)[0].url));
});

test('modelOverrides replace the default for a specific provider+tier only', async () => {
  const f = makeFetch({ anthropic: { text: '{"ok":1}' } });
  await generateAgentJson(
    { ...baseRequest, tier: 'deep' },
    {
      anthropicApiKey: 'a-key',
      modelOverrides: { anthropic: { deep: 'claude-opus-4-7' } },
      fetchImpl: f,
    },
  );
  assert.equal(requestsOf(f)[0].body.model, 'claude-opus-4-7');
});

test('throws when no providers are configured at all', async () => {
  const f = makeFetch({});
  await assert.rejects(
    () => generateAgentJson(baseRequest, { fetchImpl: f }),
    (err: unknown) => err instanceof AiAllProvidersFailedError,
  );
  assert.deepEqual(callsOf(f), []);
});
