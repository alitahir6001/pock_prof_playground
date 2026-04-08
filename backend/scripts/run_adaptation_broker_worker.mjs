import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { handleAdaptationWorkerMessage } from '../dist/src/modules/adaptation/phase3/adaptationFrameworkBindings.js';
import { processBrokerBatch } from '../dist/src/modules/adaptation/phase3/adaptationBrokerWorker.js';

const persistenceMode = process.env.ADAPTATION_PERSISTENCE_MODE === 'postgres' ? 'postgres' : 'file';
const auditFilePath = process.env.ADAPTATION_AUDIT_FILE || './data/adaptation-evaluations.json';
const databaseUrl = process.env.ADAPTATION_DATABASE_URL || process.env.DATABASE_URL || '';

const queueFile = process.env.ADAPTATION_BROKER_QUEUE_FILE || './data/adaptation-broker-queue.json';
const retryFile = process.env.ADAPTATION_BROKER_RETRY_FILE || './data/adaptation-broker-retry.json';
const deadLetterFile = process.env.ADAPTATION_BROKER_DLQ_FILE || './data/adaptation-broker-dlq.json';
const metricsFile = process.env.ADAPTATION_BROKER_METRICS_FILE || './data/adaptation-broker-metrics.json';

if (persistenceMode === 'postgres' && databaseUrl.length < 1) {
  console.error('ADAPTATION_DATABASE_URL or DATABASE_URL is required when ADAPTATION_PERSISTENCE_MODE=postgres.');
  process.exit(1);
}

async function readJsonArray(path) {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const queue = await readJsonArray(queueFile);
const messages = queue.map((m) => ({
  message_id: typeof m.message_id === 'string' ? m.message_id : `msg_${m.job_id || 'unknown'}`,
  attempt: Number.isInteger(m.attempt) && m.attempt > 0 ? m.attempt : 1,
  max_attempts: Number.isInteger(m.max_attempts) && m.max_attempts > 0 ? m.max_attempts : 3,
  worker_message: {
    job_id: m.job_id,
    payload: m.payload,
  },
}));

const postgresPool = persistenceMode === 'postgres'
  ? new (await import('pg')).Pool({ connectionString: databaseUrl })
  : undefined;

const out = await processBrokerBatch({
  messages,
  processWorker: async (workerMessage) =>
    handleAdaptationWorkerMessage(workerMessage, {
      persistenceMode,
      auditFilePath,
      postgresPool,
    }),
});

await writeJson(retryFile, out.retry_queue.map((m) => ({
  message_id: m.message_id,
  attempt: m.attempt,
  max_attempts: m.max_attempts,
  job_id: m.worker_message.job_id,
  payload: m.worker_message.payload,
})));
await writeJson(deadLetterFile, out.dead_letter_queue.map((m) => ({
  message_id: m.message_id,
  attempt: m.attempt,
  max_attempts: m.max_attempts,
  job_id: m.worker_message.job_id,
  payload: m.worker_message.payload,
  error_code: m.error_code,
  diagnostic_code: m.diagnostic_code,
})));
await writeJson(metricsFile, out.telemetry);
await writeJson(queueFile, []);

if (postgresPool) {
  await postgresPool.end();
}

process.stdout.write(`${JSON.stringify({ ok: true, persistence_mode: persistenceMode, telemetry: out.telemetry })}\n`);
