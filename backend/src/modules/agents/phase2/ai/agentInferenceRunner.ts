/**
 * Agent inference orchestrator.
 *
 * Ties the provider fallback service to the agent output guard and the agent's
 * contract (soul + instructions + example). Pure: no fs, no env, no DB — the
 * caller (the .mjs runtime) loads contract files and config and passes them in,
 * which keeps this unit-testable offline with an injectable fetch.
 *
 * Flow: assemble prompt -> generateAgentJson (validated by the guard) -> return
 * the first guard-valid response. If every provider fails, fall back to the
 * agent's example output so a pilot user is never hard-errored mid-session.
 *
 * Phase A #2 = this wiring with a first-pass prompt (embeds the example as the
 * required shape). Phase A #3 hardens the prompt to embed the full schema
 * (enums/lengths) and tunes the per-agent default tier.
 */
import {
  validateAgentOutput,
  type AgentType,
} from '../validation/agentOutputGuard.js';
import { SCHEMA_SPEC, CONTENT_RULES } from './agentPromptSpecs.js';
import {
  generateAgentJson,
  AiAllProvidersFailedError,
  type AiProviderConfig,
  type AiModelTier,
  type AiAttempt,
  type AiProviderName,
} from './aiProviderService.js';

/** Static contract for one agent, loaded from disk by the runtime. */
export interface AgentContract {
  soul: string;
  systemInstructions: string;
  /** Parsed example_output.json — used both as the prompt shape and the last-resort fallback. */
  exampleOutput: unknown;
}

export interface RunAgentInferenceParams {
  agentType: AgentType;
  input: Record<string, unknown>;
  contract: AgentContract;
  config: AiProviderConfig;
  /** Capability/cost tier. Defaults to the service default (`mid`) when unset. */
  tier?: AiModelTier;
}

/** Where the returned output came from. */
export type InferenceSource = AiProviderName | 'fallback_example';

export interface AgentInferenceResult {
  /** Guard-valid agent JSON (a live provider's, or the example on full fallback). */
  output: unknown;
  source: InferenceSource;
  /** True when every provider failed and the example was returned instead. */
  usedFallback: boolean;
  /** Per-provider attempt diagnostics (for logging/telemetry). */
  attempts: AiAttempt[];
}

/**
 * Build the system prompt for an agent: soul + instructions + the STRICT output
 * contract (the exact field sets, enums, counts, and length caps the guard
 * enforces — from agentPromptSpecs) + a concrete example. The schema spec is
 * what makes real LLM output reliably pass the guard; the example shows shape.
 */
export function buildSystemPrompt(agentType: AgentType, contract: AgentContract): string {
  const example = JSON.stringify(contract.exampleOutput, null, 2);
  return [
    contract.soul.trim(),
    '',
    contract.systemInstructions.trim(),
    '',
    'STRICT OUTPUT CONTRACT — your response is rejected if it violates any rule:',
    SCHEMA_SPEC[agentType],
    '',
    `CONTENT RULES: ${CONTENT_RULES}`,
    '',
    'FORMAT:',
    '- Respond with a SINGLE JSON object and nothing else — no prose, no markdown code fences.',
    '- Personalize every value to the user input below. Do not add, rename, or omit any keys.',
    '',
    'Example of a valid response (match this structure exactly, with your own values):',
    example,
  ].join('\n');
}

/** Render the structured agent input as the user turn. */
export function buildUserPrompt(input: Record<string, unknown>): string {
  return `User input:\n${JSON.stringify(input, null, 2)}`;
}

/**
 * Run a single agent inference. Never throws on provider failure: returns the
 * example output with `usedFallback: true` instead. Programming/config errors
 * (e.g. no fetch implementation) still propagate.
 */
export async function runAgentInference(
  params: RunAgentInferenceParams,
): Promise<AgentInferenceResult> {
  const { agentType, input, contract, config, tier } = params;

  const validate = (json: unknown) => {
    const result = validateAgentOutput(agentType, json);
    return result.ok
      ? ({ ok: true } as const)
      : ({ ok: false, detail: `${result.reason}: ${result.detail}` } as const);
  };

  try {
    const completion = await generateAgentJson(
      {
        tier,
        systemPrompt: buildSystemPrompt(agentType, contract),
        userPrompt: buildUserPrompt(input),
        validate,
      },
      config,
    );
    return {
      output: completion.json,
      source: completion.provider,
      usedFallback: false,
      attempts: completion.attempts,
    };
  } catch (err) {
    if (err instanceof AiAllProvidersFailedError) {
      return {
        output: contract.exampleOutput,
        source: 'fallback_example',
        usedFallback: true,
        attempts: err.attempts,
      };
    }
    throw err;
  }
}
