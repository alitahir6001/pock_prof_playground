import Fastify from 'fastify';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAdaptationHttpRoute } from '../dist/src/modules/adaptation/phase3/adaptationFrameworkBindings.js';
import { classifyAdaptationError } from '../dist/src/modules/adaptation/phase3/adaptationObservability.js';
import { aiProviderConfigFromEnv } from '../dist/src/modules/agents/phase2/ai/aiProviderService.js';
import { runAgentInference } from '../dist/src/modules/agents/phase2/ai/agentInferenceRunner.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const port = Number(process.env.ADAPTATION_PORT || 3040);
const host = process.env.ADAPTATION_HOST || '127.0.0.1';
const persistenceMode = process.env.ADAPTATION_PERSISTENCE_MODE === 'postgres' ? 'postgres' : 'file';
const auditFilePath = process.env.ADAPTATION_AUDIT_FILE || './data/adaptation-evaluations.json';
const databaseUrl = process.env.ADAPTATION_DATABASE_URL || process.env.DATABASE_URL || '';
const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';
const sessionTtlHours = Number(process.env.PILOT_SESSION_TTL_HOURS || '720');
const loginCodeTtlMinutes = Number(process.env.PILOT_LOGIN_CODE_TTL_MINUTES || '15');

// Build the AI provider config once at startup (reads keys + model overrides from env).
// Bound the per-provider timeout for the live request path so a slow/hung provider
// can't make a synchronous agent request hang: 3 providers x 20s = ~60s worst case.
const aiConfig = {
  ...aiProviderConfigFromEnv(),
  timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 20000),
};
const aiConfigured = Boolean(aiConfig.geminiApiKey || aiConfig.openaiApiKey || aiConfig.anthropicApiKey);

// Per-agent default capability/cost tier. Onboarding + Career Coach do heavy
// personalization (deep); the Professor's day-to-day picks are bounded (fast).
const agentTierByType = {
  onboarding_agent: 'deep',
  professor_agent: 'fast',
  career_coach_agent: 'deep',
};

if (databaseUrl.length < 1) {
  throw new Error('ADAPTATION_DATABASE_URL or DATABASE_URL is required for pilot runtime.');
}

const postgresPool = new (await import('pg')).Pool({ connectionString: databaseUrl });

const app = Fastify({ logger: true, bodyLimit: 256 * 1024 });

app.addHook('onRequest', async (request, reply) => {
  const contentType = request.headers['content-type'];
  if (typeof contentType === 'string' && contentType.includes('\t')) {
    return reply.code(400).send({ ok: false, error_code: 'BAD_REQUEST', detail: 'Invalid Content-Type header.' });
  }
});

app.addHook('onSend', async (request, reply) => {
  reply.header('access-control-allow-origin', frontendOrigin);
  reply.header('access-control-allow-methods', 'GET,POST,OPTIONS');
  reply.header('access-control-allow-headers', 'content-type,authorization,x-request-id');
});

app.options('/*', async (_request, reply) => reply.code(204).send());

app.addHook('onClose', async () => {
  await postgresPool.end();
});

app.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 500
    ? error.statusCode
    : 500;

  const errorCode = statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
  const detail = statusCode >= 500 ? 'Internal runtime error.' : (error.message || 'Invalid request payload.');

  request.log.warn(
    { err: error, errorCode, diagnosticCode: classifyAdaptationError(error), statusCode, requestId: request.id },
    'Pilot API rejected request',
  );
  reply.code(statusCode).send({ ok: false, error_code: errorCode, detail });
});

function sha(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

function randomCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function parseBearer(authHeader) {
  if (typeof authHeader !== 'string') return '';
  const [scheme, token] = authHeader.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : '';
}

async function ensurePilotUser(email) {
  const existing = await postgresPool.query('SELECT user_id FROM pilot_users WHERE email = $1 LIMIT 1', [email]);
  const existingUserId = existing.rows?.[0]?.user_id;
  if (typeof existingUserId === 'string') return existingUserId;

  const userId = `user_${randomUUID()}`;
  await postgresPool.query(
    'INSERT INTO pilot_users (user_id, email) VALUES ($1, $2)',
    [userId, email],
  );
  return userId;
}

const AGENT_DIRS = {
  onboarding_agent: 'onboarding-agent',
  professor_agent: 'professor-agent',
  career_coach_agent: 'career-coach-agent',
};

// Load each agent's static contract (soul + instructions + example) once at
// startup. The example doubles as the prompt's required shape and the
// last-resort fallback output when every provider fails.
async function loadAgentContracts() {
  const base = '../src/modules/agents/phase2';
  const entries = await Promise.all(
    Object.entries(AGENT_DIRS).map(async ([agentType, dir]) => {
      const read = (file) => readFile(join(__dirname, base, dir, file), 'utf8');
      const [soul, systemInstructions, exampleRaw] = await Promise.all([
        read('soul.md'),
        read('system_instructions.md'),
        read('example_output.json'),
      ]);
      return [agentType, { soul, systemInstructions, exampleOutput: JSON.parse(exampleRaw) }];
    }),
  );
  return Object.fromEntries(entries);
}

const agentContracts = await loadAgentContracts();

async function requireSession(request) {
  const token = parseBearer(request.headers.authorization);
  if (!token) throw Object.assign(new Error('Missing authorization token.'), { statusCode: 401 });

  const tokenHash = sha(token);
  const out = await postgresPool.query(
    `SELECT s.session_id, s.user_id, u.email
     FROM pilot_sessions s
     JOIN pilot_users u ON u.user_id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );

  const row = out.rows?.[0];
  if (!row?.user_id) throw Object.assign(new Error('Invalid or expired session.'), { statusCode: 401 });

  await postgresPool.query(
    'UPDATE pilot_sessions SET last_seen_at = NOW() WHERE session_id = $1',
    [row.session_id],
  );

  return { user_id: row.user_id, email: row.email, session_id: row.session_id };
}

async function sendLoginCodeEmail(email, code) {
  const resendApiKey = process.env.RESEND_API_KEY || '';
  const resendFrom = process.env.RESEND_FROM_EMAIL || '';

  if (!resendApiKey || !resendFrom) {
    app.log.warn({ email, code }, 'RESEND not configured; login code emitted to logs for pilot bootstrap');
    return { delivered: false, mode: 'log_only' };
  }

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [email],
      subject: 'Pocket Professor pilot login code',
      text: `Your login code is ${code}. It expires in ${loginCodeTtlMinutes} minutes.`,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Failed to deliver login code email: ${detail}`);
  }

  return { delivered: true, mode: 'resend' };
}

app.get('/adaptation/health', async () => ({
  ok: true,
  service: 'adaptation_runtime',
  persistence_mode: persistenceMode,
  audit_file_path: persistenceMode === 'file' ? auditFilePath : undefined,
  database_configured: databaseUrl.length > 0,
  pilot_auth_enabled: true,
  ai_configured: aiConfigured,
}));

app.post('/adaptation/evaluate', async (request, reply) => {
  const requestId = (typeof request.headers['x-request-id'] === 'string' && request.headers['x-request-id'].length > 0)
    ? request.headers['x-request-id']
    : randomUUID();

  const response = await handleAdaptationHttpRoute(
    { body: request.body },
    { persistenceMode, auditFilePath, postgresPool },
  );

  if (response.status >= 400) {
    request.log.warn({ status: response.status, error: response.json, requestId }, 'Adaptation evaluation failed closed');
  } else {
    request.log.info({ evaluation_id: response.json.evaluation_id, requestId }, 'Adaptation evaluation completed');
  }

  return reply.code(response.status).send(response.json);
});

app.post('/pilot/auth/email/request', async (request) => {
  const email = normalizeEmail(request.body?.email);
  if (!email || !email.includes('@')) {
    throw Object.assign(new Error('Valid email is required.'), { statusCode: 400 });
  }

  const code = randomCode();
  const codeId = `code_${randomUUID()}`;
  const expiresAt = new Date(Date.now() + loginCodeTtlMinutes * 60 * 1000).toISOString();

  await postgresPool.query(
    `INSERT INTO pilot_login_codes (code_id, email, code_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [codeId, email, sha(code), expiresAt],
  );

  const delivery = await sendLoginCodeEmail(email, code);

  return {
    ok: true,
    email,
    delivery,
    expires_at: expiresAt,
    dev_code: delivery.delivered ? undefined : code,
  };
});

app.post('/pilot/auth/email/verify', async (request) => {
  const email = normalizeEmail(request.body?.email);
  const code = String(request.body?.code || '').trim();
  if (!email || !code) {
    throw Object.assign(new Error('email and code are required.'), { statusCode: 400 });
  }

  const out = await postgresPool.query(
    `SELECT code_id
     FROM pilot_login_codes
     WHERE email = $1
       AND code_hash = $2
       AND expires_at > NOW()
       AND used_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, sha(code)],
  );

  const codeId = out.rows?.[0]?.code_id;
  if (!codeId) {
    throw Object.assign(new Error('Invalid or expired login code.'), { statusCode: 401 });
  }

  await postgresPool.query('UPDATE pilot_login_codes SET used_at = NOW() WHERE code_id = $1', [codeId]);

  const userId = await ensurePilotUser(email);
  await postgresPool.query('UPDATE pilot_users SET last_login_at = NOW() WHERE user_id = $1', [userId]);

  const sessionToken = `sess_${randomUUID()}`;
  const sessionId = `psess_${randomUUID()}`;
  const expiresAt = new Date(Date.now() + sessionTtlHours * 60 * 60 * 1000).toISOString();

  await postgresPool.query(
    `INSERT INTO pilot_sessions (session_id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [sessionId, userId, sha(sessionToken), expiresAt],
  );

  return {
    ok: true,
    session_token: sessionToken,
    expires_at: expiresAt,
    user: { user_id: userId, email },
  };
});

app.get('/pilot/me', async (request) => {
  const session = await requireSession(request);
  return { ok: true, user: { user_id: session.user_id, email: session.email } };
});

app.post('/pilot/agents/:agentType/run', async (request) => {
  const session = await requireSession(request);
  const agentType = String(request.params.agentType || '');

  if (!['onboarding_agent', 'professor_agent', 'career_coach_agent'].includes(agentType)) {
    throw Object.assign(new Error('Unsupported agent type.'), { statusCode: 400 });
  }

  const input = request.body?.input && typeof request.body.input === 'object' ? request.body.input : {};

  const inference = await runAgentInference({
    agentType,
    input,
    contract: agentContracts[agentType],
    config: aiConfig,
    tier: agentTierByType[agentType],
  });

  request.log.info(
    {
      agentType,
      source: inference.source,
      usedFallback: inference.usedFallback,
      attempts: inference.attempts.map((a) => ({ provider: a.provider, ok: a.ok, reason: a.failureReason, ms: a.durationMs })),
    },
    inference.usedFallback ? 'Agent inference fell back to example output' : 'Agent inference completed',
  );

  const output = {
    ...inference.output,
    generated_at: new Date().toISOString(),
    generated_for_user: session.user_id,
  };

  const interactionId = `ia_${randomUUID()}`;
  await postgresPool.query(
    `INSERT INTO pilot_agent_interactions (interaction_id, user_id, agent_type, input_json, output_json)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)`,
    [interactionId, session.user_id, agentType, JSON.stringify(input), JSON.stringify(output)],
  );

  return {
    ok: true,
    interaction_id: interactionId,
    agent_type: agentType,
    output,
    ai: { source: inference.source, tier: agentTierByType[agentType], used_fallback: inference.usedFallback },
  };
});

app.post('/pilot/feedback', async (request) => {
  const session = await requireSession(request);
  const component = String(request.body?.component || '').trim();
  const helpful = typeof request.body?.helpful === 'boolean' ? request.body.helpful : null;
  const comment = typeof request.body?.comment === 'string' ? request.body.comment.slice(0, 1000) : null;
  const interactionId = typeof request.body?.interaction_id === 'string' ? request.body.interaction_id : null;
  const metadata = request.body?.metadata && typeof request.body.metadata === 'object' ? request.body.metadata : {};

  if (!component) throw Object.assign(new Error('component is required.'), { statusCode: 400 });

  const feedbackId = `fb_${randomUUID()}`;
  await postgresPool.query(
    `INSERT INTO pilot_feedback_events (feedback_id, user_id, component, helpful, comment, metadata_json)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [feedbackId, session.user_id, component, helpful, comment, JSON.stringify({ ...metadata, interaction_id: interactionId })],
  );

  if (interactionId && helpful !== null) {
    await postgresPool.query(
      'UPDATE pilot_agent_interactions SET helpful = $1, feedback_comment = COALESCE($2, feedback_comment) WHERE interaction_id = $3 AND user_id = $4',
      [helpful, comment, interactionId, session.user_id],
    );
  }

  return { ok: true, feedback_id: feedbackId };
});

app.get('/pilot/interactions', async (request) => {
  const session = await requireSession(request);
  const out = await postgresPool.query(
    `SELECT interaction_id, agent_type, input_json, output_json, helpful, feedback_comment, created_at
     FROM pilot_agent_interactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [session.user_id],
  );

  return { ok: true, items: out.rows || [] };
});

try {
  await app.listen({ port, host });
  app.log.info({ persistenceMode, frontendOrigin }, `Pilot runtime listening at http://${host}:${port}`);
} catch (error) {
  app.log.error({ err: error, diagnosticCode: classifyAdaptationError(error) }, 'Pilot runtime failed to start');
  process.exit(1);
}
