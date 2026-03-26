import { handleAdaptationWorkerMessage } from '../dist/src/modules/adaptation/phase3/adaptationFrameworkBindings.js';

const persistenceMode = process.env.ADAPTATION_PERSISTENCE_MODE === 'postgres' ? 'postgres' : 'file';
const auditFilePath = process.env.ADAPTATION_AUDIT_FILE || './data/adaptation-evaluations.json';
const databaseUrl = process.env.ADAPTATION_DATABASE_URL || process.env.DATABASE_URL || '';
const rawJob = process.env.ADAPTATION_WORKER_JOB_JSON || '';

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

const postgresPool = persistenceMode === 'postgres'
  ? new (await import('pg')).Pool({ connectionString: databaseUrl })
  : undefined;

try {
  const result = await handleAdaptationWorkerMessage(job, {
    persistenceMode,
    auditFilePath,
    postgresPool,
  });

  process.stdout.write(`${JSON.stringify({ ok: true, persistence_mode: persistenceMode, result })}\n`);
} catch (error) {
  process.stdout.write(
    `${JSON.stringify({ ok: false, persistence_mode: persistenceMode, error: error instanceof Error ? error.message : String(error) })}\n`,
  );
  process.exitCode = 1;
} finally {
  if (postgresPool) {
    await postgresPool.end();
  }
}
