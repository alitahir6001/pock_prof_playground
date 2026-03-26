import Fastify from 'fastify';
import { handleAdaptationHttpRoute } from '../dist/src/modules/adaptation/phase3/adaptationFrameworkBindings.js';

const port = Number(process.env.ADAPTATION_PORT || 3040);
const host = process.env.ADAPTATION_HOST || '127.0.0.1';
const persistenceMode = process.env.ADAPTATION_PERSISTENCE_MODE === 'postgres' ? 'postgres' : 'file';
const auditFilePath = process.env.ADAPTATION_AUDIT_FILE || './data/adaptation-evaluations.json';
const databaseUrl = process.env.ADAPTATION_DATABASE_URL || process.env.DATABASE_URL || '';

if (persistenceMode === 'postgres' && databaseUrl.length < 1) {
  throw new Error('ADAPTATION_DATABASE_URL or DATABASE_URL is required when ADAPTATION_PERSISTENCE_MODE=postgres.');
}

const postgresPool = persistenceMode === 'postgres'
  ? new (await import('pg')).Pool({ connectionString: databaseUrl })
  : undefined;

const app = Fastify({
  logger: true,
  bodyLimit: 64 * 1024,
});

app.addHook('onRequest', async (request, reply) => {
  const contentType = request.headers['content-type'];
  if (typeof contentType === 'string' && contentType.includes('\t')) {
    return reply.code(400).send({ ok: false, error_code: 'BAD_REQUEST', detail: 'Invalid Content-Type header.' });
  }
});

app.addHook('onClose', async () => {
  if (postgresPool) {
    await postgresPool.end();
  }
});

app.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 500
    ? error.statusCode
    : 500;

  const errorCode = statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
  const detail = statusCode >= 500
    ? 'Internal runtime error.'
    : (error.message || 'Invalid request payload.');

  request.log.warn({ err: error, errorCode, statusCode }, 'Adaptation route rejected request');
  reply.code(statusCode).send({ ok: false, error_code: errorCode, detail });
});

app.get('/adaptation/health', async () => ({
  ok: true,
  service: 'adaptation_runtime',
  persistence_mode: persistenceMode,
  audit_file_path: persistenceMode === 'file' ? auditFilePath : undefined,
  database_configured: persistenceMode === 'postgres' ? databaseUrl.length > 0 : undefined,
}));

app.post('/adaptation/evaluate', async (request, reply) => {
  const response = await handleAdaptationHttpRoute(
    { body: request.body },
    {
      persistenceMode,
      auditFilePath,
      postgresPool,
    },
  );

  if (response.status >= 400) {
    request.log.warn({ status: response.status, error: response.json, persistenceMode }, 'Adaptation evaluation failed closed');
  } else {
    request.log.info(
      {
        evaluation_id: response.json.evaluation_id,
        applied_rule_count: Array.isArray(response.json.policy_output?.applied_rules)
          ? response.json.policy_output.applied_rules.length
          : undefined,
        persistenceMode,
      },
      'Adaptation evaluation completed',
    );
  }

  return reply.code(response.status).send(response.json);
});

try {
  await app.listen({ port, host });
  app.log.info({ persistenceMode }, `Adaptation runtime listening at http://${host}:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
