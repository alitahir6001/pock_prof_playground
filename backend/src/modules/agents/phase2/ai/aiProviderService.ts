/**
 * AI provider fallback service.
 *
 * Calls a chain of LLM providers in priority order (Gemini -> OpenAI -> Anthropic)
 * and returns the first response that both parses as JSON and passes an optional
 * caller-supplied validator. If a provider has no API key it is skipped. If a
 * provider errors, times out, returns unparseable JSON, or fails validation, the
 * service falls through to the next provider. Only when every eligible provider
 * fails does it throw {@link AiAllProvidersFailedError}.
 *
 * No third-party SDKs: each provider is a thin `fetch` wrapper against its public
 * REST endpoint. `fetch` is injectable so the service is unit-testable offline.
 *
 * Note on determinism: the deterministic guarantee in this project applies to the
 * adaptation policy engine, not to advisory agent text. We pin temperature to 0 to
 * minimize variance, but LLM output is not bit-reproducible.
 */

export type AiProviderName = 'gemini' | 'openai' | 'anthropic';

/**
 * Fixed priority order. Providers without a configured key are skipped at runtime.
 * Order balances cost vs. latency: OpenAI first (fast, mid-cost), Gemini second
 * (fast flash / variable pro), Anthropic last (most expensive, used as last resort).
 */
export const AI_PROVIDER_ORDER: readonly AiProviderName[] = ['openai', 'gemini', 'anthropic'];

/**
 * Capability/cost tier for a request.
 * - `fast` — cheap, low-latency model for bounded tasks (e.g. day-to-day
 *   session picks). Saves cost.
 * - `mid`  — balanced model for moderate reasoning.
 * - `deep` — frontier model for heavy reasoning / personalization
 *   (e.g. onboarding ranking, career pivot analysis).
 */
export type AiModelTier = 'fast' | 'mid' | 'deep';
export const AI_MODEL_TIERS: readonly AiModelTier[] = ['fast', 'mid', 'deep'];

/**
 * Built-in model defaults per provider per tier. All overridable via env
 * (see {@link aiProviderConfigFromEnv}) or {@link AiProviderConfig.modelOverrides},
 * so a model rename never requires a code change. Confirm these against the
 * actual accounts at deploy time — the AI smoke test surfaces wrong names.
 * Verified available on the project accounts 2026-06-04.
 */
export const DEFAULT_MODELS: Record<AiProviderName, Record<AiModelTier, string>> = {
  gemini: {
    // Gemini has no distinct mid model (flash=fast, pro=deep), so mid reuses the
    // fast flash — cheap and quick — rather than the slow/variable pro.
    fast: 'gemini-3.5-flash',
    mid: 'gemini-3.5-flash',
    deep: 'gemini-3.1-pro-preview',
  },
  openai: {
    fast: 'gpt-5.4-mini-2026-03-17',
    mid: 'gpt-5.4-2026-03-05',
    deep: 'gpt-5.5-2026-04-23',
  },
  anthropic: {
    fast: 'claude-haiku-4-5-20251001',
    mid: 'claude-sonnet-4-6',
    deep: 'claude-opus-4-8',
  },
};

export const DEFAULT_TIER: AiModelTier = 'mid';

export const DEFAULT_TIMEOUT_MS = 60_000;
// Generous default: current "thinking" models (Gemini 3, etc.) spend part of
// this budget on internal reasoning before producing the answer. Too small a
// budget yields an empty response. 2048 leaves room for thinking + structured JSON.
export const DEFAULT_MAX_OUTPUT_TOKENS = 2048;

export interface AiCompletionRequest {
  /** System prompt: agent soul + instructions + schema requirements. */
  systemPrompt: string;
  /** User turn: the structured session input rendered as text. */
  userPrompt: string;
  /** Capability/cost tier. Defaults to {@link DEFAULT_TIER}. */
  tier?: AiModelTier;
  /** Token ceiling for the response. Defaults to {@link DEFAULT_MAX_OUTPUT_TOKENS}. */
  maxOutputTokens?: number;
  /** Sampling temperature. Defaults to 0 to minimize variance. */
  temperature?: number;
  /**
   * Optional validator run against the parsed JSON. Returning a non-ok result
   * causes the service to fall through to the next provider. This is the seam
   * the agent output guard plugs into.
   */
  validate?: (json: unknown) => ValidationOutcome;
}

export type ValidationOutcome = { ok: true } | { ok: false; detail: string };

/** Per-provider, per-tier model name overrides. Any unset entry uses {@link DEFAULT_MODELS}. */
export type ModelOverrides = Partial<Record<AiProviderName, Partial<Record<AiModelTier, string>>>>;

export interface AiProviderConfig {
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  /** Override model names per provider per tier. Unset entries fall back to defaults. */
  modelOverrides?: ModelOverrides;
  /** Per-provider request timeout in ms. Defaults to {@link DEFAULT_TIMEOUT_MS}. */
  timeoutMs?: number;
  /** Injectable fetch implementation (for tests). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/** Outcome of a single provider attempt, for telemetry/diagnostics. */
export interface AiAttempt {
  provider: AiProviderName;
  ok: boolean;
  /** Why this attempt failed (absent on success). */
  failureReason?:
    | 'no_api_key'
    | 'http_error'
    | 'timeout'
    | 'network_error'
    | 'empty_response'
    | 'json_parse_failed'
    | 'validation_failed';
  detail?: string;
  /** Wall-clock duration of the attempt in ms. */
  durationMs: number;
}

export interface AiCompletionResult {
  provider: AiProviderName;
  /** Raw text content returned by the winning provider. */
  text: string;
  /** Parsed (and, if a validator was supplied, validated) JSON. */
  json: unknown;
  /** Every attempt made, in order, including the successful one. */
  attempts: AiAttempt[];
}

export class AiAllProvidersFailedError extends Error {
  readonly attempts: AiAttempt[];
  constructor(attempts: AiAttempt[]) {
    const summary = attempts
      .map((a) => `${a.provider}:${a.ok ? 'ok' : a.failureReason ?? 'unknown'}`)
      .join(', ');
    super(`All AI providers failed or were skipped (${summary || 'none eligible'}).`);
    this.name = 'AiAllProvidersFailedError';
    this.attempts = attempts;
  }
}

interface ResolvedConfig {
  keys: Record<AiProviderName, string>;
  models: Record<AiProviderName, Record<AiModelTier, string>>;
  timeoutMs: number;
  fetchImpl: typeof fetch;
}

function resolveModel(
  overrides: ModelOverrides | undefined,
  provider: AiProviderName,
  tier: AiModelTier,
): string {
  return overrides?.[provider]?.[tier]?.trim() || DEFAULT_MODELS[provider][tier];
}

function buildTierMap(
  overrides: ModelOverrides | undefined,
  provider: AiProviderName,
): Record<AiModelTier, string> {
  return {
    fast: resolveModel(overrides, provider, 'fast'),
    mid: resolveModel(overrides, provider, 'mid'),
    deep: resolveModel(overrides, provider, 'deep'),
  };
}

function resolveConfig(config: AiProviderConfig): ResolvedConfig {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('No fetch implementation available; pass config.fetchImpl.');
  }
  const o = config.modelOverrides;
  return {
    keys: {
      gemini: (config.geminiApiKey ?? '').trim(),
      openai: (config.openaiApiKey ?? '').trim(),
      anthropic: (config.anthropicApiKey ?? '').trim(),
    },
    models: {
      gemini: buildTierMap(o, 'gemini'),
      openai: buildTierMap(o, 'openai'),
      anthropic: buildTierMap(o, 'anthropic'),
    },
    timeoutMs: config.timeoutMs && config.timeoutMs > 0 ? config.timeoutMs : DEFAULT_TIMEOUT_MS,
    fetchImpl,
  };
}

type EnvMap = Record<string, string | undefined>;

function defaultEnv(): EnvMap {
  const proc = (globalThis as { process?: { env?: EnvMap } }).process;
  return proc?.env ?? {};
}

/**
 * Build a provider config from environment variables. Used by the runtime;
 * tests construct {@link AiProviderConfig} directly.
 */
export function aiProviderConfigFromEnv(env: EnvMap = defaultEnv()): AiProviderConfig {
  // Tier-specific env wins; a single per-provider var (e.g. GEMINI_MODEL) applies
  // to BOTH tiers as a back-compat fallback; otherwise the built-in default is used.
  const tieredModels = (prefix: string): Partial<Record<AiModelTier, string>> => {
    const shared = env[`${prefix}_MODEL`];
    const out: Partial<Record<AiModelTier, string>> = {};
    for (const tier of AI_MODEL_TIERS) {
      const value = env[`${prefix}_MODEL_${tier.toUpperCase()}`] ?? shared;
      if (value) out[tier] = value;
    }
    return out;
  };

  return {
    geminiApiKey: env.GEMINI_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    modelOverrides: {
      gemini: tieredModels('GEMINI'),
      openai: tieredModels('OPENAI'),
      anthropic: tieredModels('ANTHROPIC'),
    },
    timeoutMs: env.AI_REQUEST_TIMEOUT_MS ? Number(env.AI_REQUEST_TIMEOUT_MS) : undefined,
  };
}

/**
 * Extract a JSON object/array from raw model text. Tolerates markdown code
 * fences and leading/trailing prose by falling back to the first balanced
 * `{...}` or `[...]` span. Throws if nothing parses.
 */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();

  // Strip a single ```json ... ``` (or bare ``` ... ```) fence if present.
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    // Fall through to span extraction.
  }

  const span = firstBalancedSpan(candidate);
  if (span !== null) {
    return JSON.parse(span); // may throw — propagated to caller
  }

  throw new SyntaxError('No JSON value found in model output.');
}

/** Find the first balanced {...} or [...] span, respecting strings/escapes. */
function firstBalancedSpan(text: string): string | null {
  const startIdx = (() => {
    const obj = text.indexOf('{');
    const arr = text.indexOf('[');
    if (obj === -1) return arr;
    if (arr === -1) return obj;
    return Math.min(obj, arr);
  })();
  if (startIdx === -1) return null;

  const open = text[startIdx];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(startIdx, i + 1);
    }
  }
  return null;
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Raw provider call: returns the text content or throws a tagged error. */
async function callProvider(
  provider: AiProviderName,
  cfg: ResolvedConfig,
  req: AiCompletionRequest,
): Promise<string> {
  // Temperature is omitted unless a caller explicitly sets it: several current
  // frontier models (OpenAI gpt-5.x, Claude Opus 4.8) reject or deprecate the
  // parameter. Agents don't require determinism, so default to provider default.
  const temperature = req.temperature;
  const maxTokens = req.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const tier = req.tier ?? DEFAULT_TIER;
  const model = cfg.models[provider][tier];
  const key = cfg.keys[provider];

  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const res = await fetchWithTimeout(
      cfg.fetchImpl,
      url,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: req.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: req.userPrompt }] }],
          generationConfig: {
            ...(temperature !== undefined ? { temperature } : {}),
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
          },
        }),
      },
      cfg.timeoutMs,
    );
    if (!res.ok) throw new ProviderHttpError(res.status, await safeText(res));
    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    return text;
  }

  if (provider === 'openai') {
    const res = await fetchWithTimeout(
      cfg.fetchImpl,
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          ...(temperature !== undefined ? { temperature } : {}),
          max_completion_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: req.systemPrompt },
            { role: 'user', content: req.userPrompt },
          ],
        }),
      },
      cfg.timeoutMs,
    );
    if (!res.ok) throw new ProviderHttpError(res.status, await safeText(res));
    const data = (await res.json()) as OpenAiResponse;
    return data.choices?.[0]?.message?.content ?? '';
  }

  // anthropic
  const res = await fetchWithTimeout(
    cfg.fetchImpl,
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        ...(temperature !== undefined ? { temperature } : {}),
        system: req.systemPrompt,
        messages: [{ role: 'user', content: req.userPrompt }],
      }),
    },
    cfg.timeoutMs,
  );
  if (!res.ok) throw new ProviderHttpError(res.status, await safeText(res));
  const data = (await res.json()) as AnthropicResponse;
  return data.content?.map((c) => (c.type === 'text' ? c.text : '')).join('') ?? '';
}

class ProviderHttpError extends Error {
  readonly status: number;
  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body.slice(0, 500)}`);
    this.name = 'ProviderHttpError';
    this.status = status;
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '<unreadable body>';
  }
}

function classifyError(err: unknown): { reason: AiAttempt['failureReason']; detail: string } {
  if (err instanceof ProviderHttpError) {
    return { reason: 'http_error', detail: err.message };
  }
  if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
    return { reason: 'timeout', detail: err.message };
  }
  if (err instanceof Error) {
    return { reason: 'network_error', detail: err.message };
  }
  return { reason: 'network_error', detail: String(err) };
}

/**
 * Run the provider chain and return the first valid JSON response.
 * @throws {AiAllProvidersFailedError} if no eligible provider succeeds.
 */
export async function generateAgentJson(
  request: AiCompletionRequest,
  config: AiProviderConfig,
): Promise<AiCompletionResult> {
  const cfg = resolveConfig(config);
  const attempts: AiAttempt[] = [];

  for (const provider of AI_PROVIDER_ORDER) {
    if (!cfg.keys[provider]) {
      attempts.push({ provider, ok: false, failureReason: 'no_api_key', durationMs: 0 });
      continue;
    }

    const startedAt = Date.now();
    try {
      const text = await callProvider(provider, cfg, request);

      if (text.trim().length === 0) {
        attempts.push({
          provider,
          ok: false,
          failureReason: 'empty_response',
          durationMs: Date.now() - startedAt,
        });
        continue;
      }

      let json: unknown;
      try {
        json = extractJson(text);
      } catch (parseErr) {
        attempts.push({
          provider,
          ok: false,
          failureReason: 'json_parse_failed',
          detail: parseErr instanceof Error ? parseErr.message : String(parseErr),
          durationMs: Date.now() - startedAt,
        });
        continue;
      }

      if (request.validate) {
        const outcome = request.validate(json);
        if (!outcome.ok) {
          attempts.push({
            provider,
            ok: false,
            failureReason: 'validation_failed',
            detail: outcome.detail,
            durationMs: Date.now() - startedAt,
          });
          continue;
        }
      }

      attempts.push({ provider, ok: true, durationMs: Date.now() - startedAt });
      return { provider, text, json, attempts };
    } catch (err) {
      const { reason, detail } = classifyError(err);
      attempts.push({
        provider,
        ok: false,
        failureReason: reason,
        detail,
        durationMs: Date.now() - startedAt,
      });
    }
  }

  throw new AiAllProvidersFailedError(attempts);
}

// ── Minimal provider response shapes (only the fields we read) ──────────────

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

interface OpenAiResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
}
