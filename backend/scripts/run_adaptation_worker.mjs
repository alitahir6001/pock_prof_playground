import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { handleAdaptationWorkerMessage } from '../dist/src/modules/adaptation/phase3/adaptationFrameworkBindings.js';
import { classifyAdaptationError } from '../dist/src/modules/adaptation/phase3/adaptationObservability.js';
import { resolveRetryDirective } from '../dist/src/modules/adaptation/phase3/adaptationWorkerRetryPolicy.js';

const persistenceMode = process.env.ADAPTATION_PERSISTENCE_MODE === 'postgres' ? 'postgres' : 'file';
const auditFilePath = process.env.ADAPTATION_AUDIT_FILE || './data/adaptation-evaluations.json';
const databaseUrl = process.env.ADAPTATION_DATABASE_URL || process.env.DATABASE_URL || '';
const rawJob = process.env.ADAPTATION_WORKER_JOB_JSON || '';
const maxAttempts = Number(process.env.ADAPTATION_WORKER_MAX_ATTEMPTS || '3');
const idempotencyFile = process.env.ADAPTATION_WORKER_IDEMPOTENCY_FILE || './data/adaptation-worker-idempotency.json';

if (!rawJob) {
  console.error('ADAPTATION_WORKER_JOB_JSON is required (serialized worker message).');
  process.exit(1);
}

if (persistenceMode === 'postgres' && databaseUrl.length < 1) {
  console.error('ADAPTATION_DATABASE_URL or DATABASE_URL is required when ADAPTATION_PERSISTENCE_MODE=postgres.');
  process.exit(1);
}

let job;
try {
  job = JSON.parse(rawJob);
} catch (error) {
  console.error(`Invalid ADAPTATION_WORKER_JOB_JSON: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const envelope = {
  message_id: typeof job.message_id === 'string' && job.message_id.length > 0 ? job.message_id : `msg_${job.job_id || 'unknown'}`,
  attempt: Number.isInteger(job.attempt) && job.attempt > 0 ? job.attempt : 1,
  max_attempts: Number.isInteger(job.max_attempts) && job.max_attempts > 0 ? job.max_attempts : maxAttempts,
  worker_message: {
    job_id: job.job_id,
    payload: job.payload,
  },
};

if (typeof envelope.worker_message.job_id !== 'string' || envelope.worker_message.job_id.length < 1) {
  console.error('worker message job_id is required.');
  process.exit(1);
}

async function loadIdempotencyStore() {
  try {
    const raw = await readFile(idempotencyFile, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function saveIdempotencyStore(store) {
  await mkdir(dirname(idempotencyFile), { recursive: true });
  await writeFile(idempotencyFile, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

const idempotencyStore = await loadIdempotencyStore();
const existing = idempotencyStore[envelope.message_id];
if (existing && existing.status === 'completed') {
  process.stdout.write(`${JSON.stringify({
    ok: true,
    persistence_mode: persistenceMode,
    duplicate: true,
    envelope,
    result: existing.result,
  })}\n`);
  process.exit(0);
}

const postgresPool = persistenceMode === 'postgres'
  ? new (await import('pg')).Pool({ connectionString: databaseUrl })
  : undefined;

try {
  const result = await handleAdaptationWorkerMessage(envelope.worker_message, {
    persistenceMode,
    auditFilePath,
    postgresPool,
  });

  const response = {
    ok: true,
    persistence_mode: persistenceMode,
    envelope,
    result,
  };

  if (result.status === 'completed') {
    idempotencyStore[envelope.message_id] = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      result,
    };
    await saveIdempotencyStore(idempotencyStore);
    process.stdout.write(`${JSON.stringify(response)}\n`);
    process.exit(0);
  }

  const diagnosticCode = result.diagnostic_code ? result.diagnostic_code : classifyAdaptationError(result.error_code);
  const retryDirective = resolveRetryDirective({
    attempt: envelope.attempt,
    max_attempts: envelope.max_attempts,
    diagnostic_code: diagnosticCode,
  });

  process.stdout.write(`${JSON.stringify({ ...response, retry: retryDirective })}\n`);
  process.exit(retryDirective.retryable ? 75 : 0);
} catch (error) {
  const diagnosticCode = classifyAdaptationError(error);
  const retryDirective = resolveRetryDirective({
    attempt: envelope.attempt,
    max_attempts: envelope.max_attempts,
    diagnostic_code: diagnosticCode,
  });

  process.stdout.write(
    `${JSON.stringify({
      ok: false,
      persistence_mode: persistenceMode,
      envelope,
      diagnostic_code: diagnosticCode,
      error: error instanceof Error ? error.message : String(error),
      retry: retryDirective,
    })}\n`,
  );
  process.exit(retryDirective.retryable ? 75 : 1);
} finally {
  if (postgresPool) {
    await postgresPool.end();
  }
}
