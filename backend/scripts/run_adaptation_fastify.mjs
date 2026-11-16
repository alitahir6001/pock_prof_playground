import Fastify from 'fastify';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAdaptationHttpRoute } from '../dist/src/modules/adaptation/phase3/adaptationFrameworkBindings.js';
import { classifyAdaptationError } from '../dist/src/modules/adaptation/phase3/adaptationObservability.js';
import { aiProviderConfigFromEnv } from '../dist/src/modules/agents/phase2/ai/aiProviderService.js';
import { runAgentInference } from '../dist/src/modules/agents/phase2/ai/agentInferenceRunner.js';
import { emailConfigFromEnv, isEmailConfigured, sendEmail } from '../dist/src/modules/email/sendEmail.js';
import { isEmailAllowed } from '../dist/src/modules/pilot/emailAllowlist.js';
import { evaluateComeback } from '../dist/src/modules/student/comeback.js';
import { isValidReminderTime } from '../dist/src/modules/student/nudge.js';
import { nudgeModeFromEnv, parseAllowlist, runNudgeTick } from '../dist/src/modules/student/nudgeRunner.js';
import { buildProfessorHistory } from '../dist/src/modules/student/professorHistory.js';
import { isValidTimeZone, localDateInZone } from '../dist/src/modules/student/studentFile.js';
import { appendEvent, loadStudentFile } from '../dist/src/modules/student/studentFileStore.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const port = Number(process.env.ADAPTATION_PORT || 3040);
const host = process.env.ADAPTATION_HOST || '127.0.0.1';
const persistenceMode = process.env.ADAPTATION_PERSISTENCE_MODE === 'postgres' ? 'postgres' : 'file';
const auditFilePath = process.env.ADAPTATION_AUDIT_FILE || './data/adaptation-evaluations.json';
const databaseUrl = process.env.ADAPTATION_DATABASE_URL || process.env.DATABASE_URL || '';
const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';
const sessionTtlHours = Number(process.env.PILOT_SESSION_TTL_HOURS || '720');
const loginCodeTtlMinutes = Number(process.env.PILOT_LOGIN_CODE_TTL_MINUTES || '15');
// Admin portal is gated to a single email. Unset → admin is fully disabled
// (fail-closed); no static admin token exists to leak.
const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
// Comma-separated emails that may log in. Unset = anyone (local dev).
const allowedEmails = parseAllowlist(process.env.PILOT_ALLOWED_EMAILS);

const isProd = process.env.NODE_ENV === 'production';
// Only ever return the login code in the HTTP response when explicitly enabled
// (local dev). NEVER keyed on email-delivery status — a prod email misconfig
// must not leak codes. See security finding C1.
const exposeDevCode = process.env.PILOT_EXPOSE_DEV_CODE === 'true';
// /adaptation/evaluate internal-token gate (finding M1). In prod the token is
// required (fail-closed); locally it's open unless a token is set.
const adaptationInternalToken = process.env.ADAPTATION_INTERNAL_TOKEN || '';
// Lock an email after this many failed verify attempts within the code TTL.
const MAX_LOGIN_ATTEMPTS = 8;

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

// Wildcard CORS is unsafe for an authenticated, deployed app (finding C3).
if (frontendOrigin === '*') {
  const msg = 'FRONTEND_ORIGIN is "*" (wildcard CORS). Set it to the exact frontend URL.';
  if (isProd) throw new Error(`Refusing to start in production: ${msg}`);
  app.log.warn(`[security] ${msg} Allowed for local dev only.`);
}

app.addHook('onRequest', async (request, reply) => {
  const contentType = request.headers['content-type'];
  if (typeof contentType === 'string' && contentType.includes('\t')) {
    return reply.code(400).send({ ok: false, error_code: 'BAD_REQUEST', detail: 'Invalid Content-Type header.' });
  }
});

app.addHook('onSend', async (request, reply) => {
  reply.header('access-control-allow-origin', frontendOrigin);
  reply.header('access-control-allow-methods', 'GET,POST,OPTIONS');
  reply.header('access-control-allow-headers', 'content-type,authorization,x-request-id,traceparent,tracestate');
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
  // CSPRNG — Math.random() is not cryptographically secure.
  return String(randomInt(100000, 1000000));
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
  // Checked here too, so a session made before the list was set stops working.
  if (!isEmailAllowed(normalizeEmail(row.email), allowedEmails, adminEmail)) {
    throw Object.assign(new Error('Invalid or expired session.'), { statusCode: 401 });
  }

  await postgresPool.query(
    'UPDATE pilot_sessions SET last_seen_at = NOW() WHERE session_id = $1',
    [row.session_id],
  );

  return { user_id: row.user_id, email: row.email, session_id: row.session_id };
}

// Admin gate: a valid session whose email matches ADMIN_EMAIL exactly.
// Fail-closed — if ADMIN_EMAIL is unset, NO ONE is admin.
async function requireAdmin(request) {
  const session = await requireSession(request);
  if (!adminEmail || String(session.email || '').trim().toLowerCase() !== adminEmail) {
    throw Object.assign(new Error('Not authorized.'), { statusCode: 403 });
  }
  return session;
}

const emailConfig = emailConfigFromEnv(process.env);

async function sendLoginCodeEmail(email, code) {
  if (!isEmailConfigured(emailConfig)) {
    // Only emit the code to logs when dev exposure is explicitly enabled —
    // never log secrets in a real deployment (finding C1).
    if (exposeDevCode) {
      app.log.warn({ email, code }, 'RESEND not configured; login code emitted to logs (dev mode)');
    } else {
      app.log.warn({ email }, 'RESEND not configured and PILOT_EXPOSE_DEV_CODE is off; login code NOT delivered');
    }
    return { delivered: false, mode: 'log_only' };
  }

  await sendEmail(emailConfig, {
    to: email,
    subject: 'Pocket Professor pilot login code',
    text: `Your login code is ${code}. It expires in ${loginCodeTtlMinutes} minutes.`,
  });

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
  // Internal-only endpoint (not part of the pilot user flow). In production it
  // requires a matching internal token; if the token is unset in prod the
  // endpoint is effectively disabled (fail-closed). Locally it's open unless a
  // token is configured. See finding M1.
  if (isProd || adaptationInternalToken) {
    if (!adaptationInternalToken || request.headers['x-internal-token'] !== adaptationInternalToken) {
      return reply.code(403).send({ ok: false, error_code: 'FORBIDDEN', detail: 'This endpoint requires a valid internal token.' });
    }
  }

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
  // Before any code is stored or mailed: strangers must not be able to make us send email.
  if (!isEmailAllowed(email, allowedEmails, adminEmail)) {
    throw Object.assign(new Error("This email isn't on the pilot list."), { statusCode: 403 });
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
    // Only ever returned when explicitly enabled for local dev (finding C1).
    dev_code: exposeDevCode && !delivery.delivered ? code : undefined,
  };
});

app.post('/pilot/auth/email/verify', async (request) => {
  const email = normalizeEmail(request.body?.email);
  const code = String(request.body?.code || '').trim();
  if (!email || !code) {
    throw Object.assign(new Error('email and code are required.'), { statusCode: 400 });
  }

  // Brute-force lockout (finding C2): sum failed attempts across all of this
  // email's codes within the TTL window. Summing (not per-code) means requesting
  // a fresh code can't reset the budget.
  const fails = await postgresPool.query(
    `SELECT COALESCE(SUM(attempts), 0)::int AS fails
     FROM pilot_login_codes
     WHERE email = $1 AND created_at > NOW() - ($2 || ' minutes')::interval`,
    [email, String(loginCodeTtlMinutes)],
  );
  if ((fails.rows?.[0]?.fails || 0) >= MAX_LOGIN_ATTEMPTS) {
    throw Object.assign(new Error('Too many attempts. Request a new code and wait a few minutes.'), { statusCode: 429 });
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
    // Record the miss on the most recent active code for this email.
    await postgresPool.query(
      `UPDATE pilot_login_codes SET attempts = attempts + 1
       WHERE code_id = (
         SELECT code_id FROM pilot_login_codes
         WHERE email = $1 AND expires_at > NOW() AND used_at IS NULL
         ORDER BY created_at DESC LIMIT 1
       )`,
      [email],
    );
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

// time_zone decides what "today" and "a missed day" mean; reminder_time is when
// the daily nudge goes out, on the user's own clock. Send either or both.
app.post('/pilot/me/settings', async (request) => {
  const session = await requireSession(request);
  const timeZone = request.body?.time_zone;
  const reminderTime = request.body?.reminder_time;
  if (timeZone === undefined && reminderTime === undefined) {
    throw Object.assign(new Error('time_zone or reminder_time is required.'), { statusCode: 400 });
  }
  if (timeZone !== undefined && !isValidTimeZone(timeZone)) {
    throw Object.assign(new Error('time_zone must be an IANA zone name.'), { statusCode: 400 });
  }
  if (reminderTime !== undefined && !isValidReminderTime(reminderTime)) {
    throw Object.assign(new Error('reminder_time must be HH:MM (24-hour).'), { statusCode: 400 });
  }
  // The stop token is minted with the first reminder time and never changes after.
  const out = await postgresPool.query(
    `UPDATE pilot_users
     SET time_zone = COALESCE($1, time_zone),
         reminder_time = COALESCE(($2::text)::time, reminder_time),
         nudge_stop_token = CASE WHEN $2::text IS NULL THEN nudge_stop_token
                                 ELSE COALESCE(nudge_stop_token, $3) END
     WHERE user_id = $4
     RETURNING time_zone, to_char(reminder_time, 'HH24:MI') AS reminder_time,
               (nudges_stopped_at IS NOT NULL) AS nudges_stopped`,
    [timeZone ?? null, reminderTime ?? null, randomBytes(24).toString('base64url'), session.user_id],
  );
  return { ok: true, settings: out.rows[0] };
});

// The stop link in the nudge email. No login: the token is the proof. POST, not
// GET, because mail scanners follow GET links and would switch reminders off.
app.post('/pilot/nudge/stop', async (request) => {
  const token = typeof request.body?.token === 'string' ? request.body.token : '';
  if (token.length < 16) throw Object.assign(new Error('Invalid stop link.'), { statusCode: 400 });

  const found = await postgresPool.query(
    'SELECT user_id, time_zone FROM pilot_users WHERE nudge_stop_token = $1 LIMIT 1',
    [token],
  );
  const user = found.rows?.[0];
  if (!user) throw Object.assign(new Error('Invalid stop link.'), { statusCode: 400 });

  const stopped = await postgresPool.query(
    'UPDATE pilot_users SET nudges_stopped_at = NOW() WHERE user_id = $1 AND nudges_stopped_at IS NULL',
    [user.user_id],
  );
  // rowCount 0 = already stopped; a second click is not a second event.
  if (stopped.rowCount > 0) {
    const zone = isValidTimeZone(user.time_zone) ? user.time_zone : 'UTC';
    await appendEvent(postgresPool, {
      userId: user.user_id,
      eventType: 'nudge_stopped',
      localDate: localDateInZone(new Date(), zone),
    });
  }
  return { ok: true };
});

app.post('/pilot/agents/:agentType/run', async (request) => {
  const session = await requireSession(request);
  const agentType = String(request.params.agentType || '');

  if (!['onboarding_agent', 'professor_agent', 'career_coach_agent'].includes(agentType)) {
    throw Object.assign(new Error('Unsupported agent type.'), { statusCode: 400 });
  }

  let input = request.body?.input && typeof request.body.input === 'object' ? request.body.input : {};
  let comeback = null;

  // The Professor's memory comes from the student file, never from the client:
  // spread last so a client-sent student_history is overwritten.
  if (agentType === 'professor_agent') {
    const file = await loadStudentFile(postgresPool, session.user_id, new Date());
    input = { ...input, student_history: buildProfessorHistory(file.events, file.today) };

    comeback = await comebackFor(session.user_id, file);
    if (comeback) {
      // The server sizes a comeback session; the client's number is ignored.
      input.minutes_available_today = comeback.minutes;
      const { note, ...payload } = comeback;
      await appendEvent(postgresPool, {
        userId: session.user_id,
        eventType: 'comeback_checkin',
        localDate: file.today,
        payload,
      });
    }
  }

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
    comeback,
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

// --- Admin: cohort retention view (founder-only) --------------------------
// One row per pilot user with onboarding + sprint activity, so the founder can
// see who to nudge. Read-only. Gated by requireAdmin (ADMIN_EMAIL).
app.get('/pilot/admin/cohort', async (request) => {
  await requireAdmin(request);
  const out = await postgresPool.query(
    `SELECT u.email,
            u.created_at                       AS joined_at,
            u.last_login_at                    AS last_login_at,
            (p.plan_id IS NOT NULL)            AS onboarded,
            p.active_track_id                  AS active_track_id,
            COALESCE(p.sprint_day_count, 14)   AS sprint_day_count,
            COUNT(d.day_index)                 AS days_done,
            MAX(d.completed_at)                AS last_session_at
     FROM pilot_users u
     LEFT JOIN pilot_plans p       ON p.user_id = u.user_id
     LEFT JOIN pilot_sprint_days d ON d.user_id = u.user_id
     GROUP BY u.email, u.created_at, u.last_login_at, p.plan_id, p.active_track_id, p.sprint_day_count
     ORDER BY last_session_at ASC NULLS FIRST, u.created_at ASC`,
  );
  return { ok: true, generated_at: new Date().toISOString(), users: out.rows || [] };
});

// --- Admin: one user's student file, in order (founder-only) --------------
app.get('/pilot/admin/student-file', async (request) => {
  await requireAdmin(request);
  const email = normalizeEmail(request.query?.email);
  const found = await postgresPool.query('SELECT user_id FROM pilot_users WHERE email = $1 LIMIT 1', [email]);
  if (found.rowCount === 0) throw Object.assign(new Error('No user with that email.'), { statusCode: 404 });

  const file = await loadStudentFile(postgresPool, found.rows[0].user_id, new Date());
  return { ok: true, email, time_zone: file.timeZone, today: file.today, events: file.events };
});

// Null on an ordinary day. The base length is the one the student chose in onboarding.
async function comebackFor(userId, file) {
  const res = await postgresPool.query(
    `SELECT plan_json->'sprint'->>'daily_minutes_target' AS minutes FROM pilot_plans WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  const baseMinutes = Number(res.rows?.[0]?.minutes) || 20;
  return evaluateComeback(file.events, file.today, baseMinutes, userId);
}

// --- Sprint plan persistence (one active plan per user) -------------------

async function loadPlanForUser(userId) {
  const planRes = await postgresPool.query(
    `SELECT plan_id, plan_json, active_track_id, sprint_day_count, created_at, updated_at
     FROM pilot_plans WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  if (planRes.rowCount === 0) return null;
  const plan = planRes.rows[0];

  const daysRes = await postgresPool.query(
    `SELECT day_index, track_id, interaction_id, task_summary, completed_at
     FROM pilot_sprint_days WHERE plan_id = $1 ORDER BY day_index ASC`,
    [plan.plan_id],
  );

  return {
    plan_id: plan.plan_id,
    plan: plan.plan_json,
    active_track_id: plan.active_track_id,
    sprint_day_count: plan.sprint_day_count,
    completed_days: daysRes.rows || [],
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  };
}

app.get('/pilot/plan', async (request) => {
  const session = await requireSession(request);
  const plan = await loadPlanForUser(session.user_id);
  let comeback = null;
  if (plan) {
    // Opening the app is when misses since the last visit get written down.
    const file = await loadStudentFile(postgresPool, session.user_id, new Date());
    comeback = await comebackFor(session.user_id, file);
  }
  return { ok: true, plan, comeback };
});

// Upsert the user's single active plan. Re-onboarding replaces the prior plan
// (and its sprint days cascade-delete via the plan_id FK).
app.post('/pilot/plan', async (request) => {
  const session = await requireSession(request);
  const planJson = request.body?.plan && typeof request.body.plan === 'object' ? request.body.plan : null;
  if (!planJson) throw Object.assign(new Error('plan is required.'), { statusCode: 400 });

  const activeTrackId = typeof request.body?.active_track_id === 'string'
    ? request.body.active_track_id
    : (typeof planJson.active_track_id === 'string' ? planJson.active_track_id : null);
  const sprintDayCount = Number.isInteger(request.body?.sprint_day_count) ? request.body.sprint_day_count : 14;

  const existing = await postgresPool.query('SELECT plan_id FROM pilot_plans WHERE user_id = $1 LIMIT 1', [session.user_id]);
  let planId;
  if (existing.rowCount > 0) {
    // Replace the plan in place: clear prior sprint days, then update the row.
    planId = existing.rows[0].plan_id;
    await postgresPool.query('DELETE FROM pilot_sprint_days WHERE plan_id = $1', [planId]);
    await postgresPool.query(
      `UPDATE pilot_plans
       SET plan_json = $1::jsonb, active_track_id = $2, sprint_day_count = $3, updated_at = NOW()
       WHERE plan_id = $4`,
      [JSON.stringify(planJson), activeTrackId, sprintDayCount, planId],
    );
  } else {
    planId = `plan_${randomUUID()}`;
    await postgresPool.query(
      `INSERT INTO pilot_plans (plan_id, user_id, plan_json, active_track_id, sprint_day_count)
       VALUES ($1, $2, $3::jsonb, $4, $5)`,
      [planId, session.user_id, JSON.stringify(planJson), activeTrackId, sprintDayCount],
    );
  }

  // Load first so misses under the old plan are recorded before the new start.
  const file = await loadStudentFile(postgresPool, session.user_id, new Date());
  await appendEvent(postgresPool, {
    userId: session.user_id,
    eventType: 'plan_started',
    localDate: file.today,
    payload: { plan_id: planId, active_track_id: activeTrackId },
  });

  const plan = await loadPlanForUser(session.user_id);
  return { ok: true, plan };
});

// Switch the active track WITHOUT resetting sprint progress. (POST /pilot/plan
// is a full replace that clears days; this is the metadata-only update.)
app.post('/pilot/plan/track', async (request) => {
  const session = await requireSession(request);
  const trackId = typeof request.body?.active_track_id === 'string' ? request.body.active_track_id : null;
  if (!trackId) throw Object.assign(new Error('active_track_id is required.'), { statusCode: 400 });

  const upd = await postgresPool.query(
    `UPDATE pilot_plans
     SET active_track_id = $1,
         plan_json = jsonb_set(plan_json, '{active_track_id}', to_jsonb($1::text)),
         updated_at = NOW()
     WHERE user_id = $2`,
    [trackId, session.user_id],
  );
  if (upd.rowCount === 0) throw Object.assign(new Error('No active plan.'), { statusCode: 400 });

  const plan = await loadPlanForUser(session.user_id);
  return { ok: true, plan };
});

// Mark a sprint day done. day_index is 1-based; the next pending day is
// (completed_count + 1). Idempotent per (plan_id, day_index) via UNIQUE.
app.post('/pilot/plan/day', async (request) => {
  const session = await requireSession(request);
  const existing = await postgresPool.query('SELECT plan_id FROM pilot_plans WHERE user_id = $1 LIMIT 1', [session.user_id]);
  if (existing.rowCount === 0) throw Object.assign(new Error('No active plan.'), { statusCode: 400 });
  const planId = existing.rows[0].plan_id;

  const dayIndex = Number.isInteger(request.body?.day_index) ? request.body.day_index : null;
  if (!dayIndex || dayIndex < 1) throw Object.assign(new Error('day_index (>=1) is required.'), { statusCode: 400 });
  const trackId = typeof request.body?.track_id === 'string' ? request.body.track_id : null;
  const interactionId = typeof request.body?.interaction_id === 'string' ? request.body.interaction_id : null;
  const taskSummary = typeof request.body?.task_summary === 'string' ? request.body.task_summary.slice(0, 400) : null;

  const dayId = `day_${randomUUID()}`;
  // One transaction: the sprint day and its student-file event land together or not at all.
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    const file = await loadStudentFile(client, session.user_id, new Date());
    const inserted = await client.query(
      `INSERT INTO pilot_sprint_days (day_id, user_id, plan_id, day_index, track_id, interaction_id, task_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (plan_id, day_index) DO NOTHING`,
      [dayId, session.user_id, planId, dayIndex, trackId, interactionId, taskSummary],
    );
    // rowCount 0 = a repeat of a day already marked done; don't log it twice.
    if (inserted.rowCount > 0) {
      await appendEvent(client, {
        userId: session.user_id,
        eventType: 'session_completed',
        localDate: file.today,
        payload: { day_index: dayIndex, track_id: trackId, task_summary: taskSummary, interaction_id: interactionId },
      });
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const plan = await loadPlanForUser(session.user_id);
  return { ok: true, plan };
});

// --- Daily nudge: an in-process timer, off unless NUDGE_ENABLED=true ---------
if (process.env.NUDGE_ENABLED === 'true') {
  const nudgeDeps = {
    mode: nudgeModeFromEnv(process.env.NUDGE_MODE),
    allowlist: parseAllowlist(process.env.NUDGE_ALLOWLIST),
    appUrl: frontendOrigin === '*' ? 'http://localhost:5173' : frontendOrigin,
    sendEmail: (message) => sendEmail(emailConfig, message),
    log: (info, message) => app.log.info(info, message),
  };
  let nudgeTickRunning = false;
  const nudgeTimer = setInterval(async () => {
    if (nudgeTickRunning) return; // a slow pass must not overlap the next one
    nudgeTickRunning = true;
    try {
      await runNudgeTick(postgresPool, new Date(), nudgeDeps);
    } catch (error) {
      app.log.error({ err: error }, 'Nudge tick failed');
    } finally {
      nudgeTickRunning = false;
    }
  }, 60 * 1000);
  app.addHook('onClose', async () => clearInterval(nudgeTimer));
  app.log.info({ mode: nudgeDeps.mode, allowlist_size: nudgeDeps.allowlist.length }, 'Nudge timer on (checks once a minute)');
}

try {
  await app.listen({ port, host });
  app.log.info({ persistenceMode, frontendOrigin }, `Pilot runtime listening at http://${host}:${port}`);
} catch (error) {
  app.log.error({ err: error, diagnosticCode: classifyAdaptationError(error) }, 'Pilot runtime failed to start');
  process.exit(1);
}
