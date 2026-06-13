import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  validateAgentOutput,
  type AgentType,
} from '../../../src/modules/agents/phase2/validation/agentOutputGuard.js';
import { SCHEMA_SPEC } from '../../../src/modules/agents/phase2/ai/agentPromptSpecs.js';

const agents: Array<[AgentType, string]> = [
  ['onboarding_agent', 'onboarding-agent'],
  ['professor_agent', 'professor-agent'],
  ['career_coach_agent', 'career-coach-agent'],
];

// example_output.json lives under src/ (not compiled into dist); resolve the
// real source path relative to this compiled test file.
function readExample(dir: string): unknown {
  const url = new URL(
    `../../../../src/modules/agents/phase2/${dir}/example_output.json`,
    import.meta.url,
  );
  return JSON.parse(readFileSync(fileURLToPath(url), 'utf8'));
}

// If this fails, the embedded example (used in the prompt AND as the last-resort
// fallback) no longer matches the guard — the prompt spec must be re-synced.
for (const [agentType, dir] of agents) {
  test(`${agentType} example_output.json passes the guard`, () => {
    const result = validateAgentOutput(agentType, readExample(dir));
    if (!result.ok) throw new Error(`${agentType} example rejected — ${result.reason}: ${result.detail}`);
    assert.equal(result.ok, true);
  });

  test(`${agentType} has a schema spec`, () => {
    assert.ok(SCHEMA_SPEC[agentType] && SCHEMA_SPEC[agentType].length > 0);
  });
}
