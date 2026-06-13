/**
 * Live agent-inference smoke (Phase A #3 proof).
 *
 * Runs each agent through runAgentInference with a realistic input and real
 * provider keys, and reports whether the LIVE model output passed the strict
 * guard (source = a provider name) or fell back to the canned example
 * (used_fallback = true). This is the end-to-end check that the hardened prompts
 * produce guard-valid output — WITHOUT needing the database (no route/auth).
 *
 * Makes real, billable calls (one per agent, at each agent's tier). Run:
 *   npm run smoke:agents
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aiProviderConfigFromEnv } from '../dist/src/modules/agents/phase2/ai/aiProviderService.js';
import { runAgentInference } from '../dist/src/modules/agents/phase2/ai/agentInferenceRunner.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const AGENT_DIRS = {
  onboarding_agent: 'onboarding-agent',
  professor_agent: 'professor-agent',
  career_coach_agent: 'career-coach-agent',
};
const tierByAgent = { onboarding_agent: 'deep', professor_agent: 'fast', career_coach_agent: 'deep' };

const sampleInput = {
  onboarding_agent: {
    current_job: 'bartender',
    daily_minutes_available: 20,
    schedule: 'late and irregular shifts, some double shifts',
    current_skills: ['customer service', 'cash handling', 'POS systems', 'multitasking under pressure'],
    goal: 'move into a tech career with more stable hours',
  },
  professor_agent: {
    topic: 'IT support fundamentals',
    comfort_level: 'beginner',
    recent_behavior: 'missed 2 of the last 4 sessions, low energy',
    minutes_available_today: 15,
  },
  career_coach_agent: {
    feels_stuck_on: 'not sure IT support is right; curious about data analysis',
    current_path: 'IT support specialist',
    sessions_completed: 5,
  },
};

async function loadContract(agentType) {
  const dir = join(__dirname, '../src/modules/agents/phase2', AGENT_DIRS[agentType]);
  const [soul, systemInstructions, exampleRaw] = await Promise.all([
    readFile(join(dir, 'soul.md'), 'utf8'),
    readFile(join(dir, 'system_instructions.md'), 'utf8'),
    readFile(join(dir, 'example_output.json'), 'utf8'),
  ]);
  return { soul, systemInstructions, exampleOutput: JSON.parse(exampleRaw) };
}

const config = { ...aiProviderConfigFromEnv(), timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 30000) };

console.log('\n🤖 Live agent-inference smoke\n');

let anyFallback = false;
for (const agentType of Object.keys(AGENT_DIRS)) {
  const tier = tierByAgent[agentType];
  const contract = await loadContract(agentType);
  const startedAt = Date.now();
  try {
    const result = await runAgentInference({
      agentType,
      input: sampleInput[agentType],
      contract,
      config,
      tier,
    });
    const ms = Date.now() - startedAt;
    if (result.usedFallback) {
      anyFallback = true;
      console.log(`  ⚠️  ${agentType} (${tier}) — FELL BACK to example in ${ms}ms (live output failed the guard)`);
      const fails = result.attempts.filter((a) => a.failureReason === 'validation_failed');
      for (const a of fails) console.log(`        ${a.provider}: ${a.detail}`);
    } else {
      console.log(`  ✅ ${agentType} (${tier}) — real output from ${result.source} passed the guard in ${ms}ms`);
      console.log(`        ${JSON.stringify(result.output).slice(0, 240)}…`);
    }
  } catch (err) {
    anyFallback = true;
    console.log(`  ❌ ${agentType} (${tier}) — ERROR: ${err?.message}`);
  }
  console.log('');
}

if (anyFallback) {
  console.log('Some agents fell back or errored — the prompt may need tightening. See details above.\n');
  process.exit(1);
}
console.log('All agents produced guard-valid live output. Phase A #3 verified end-to-end.\n');
