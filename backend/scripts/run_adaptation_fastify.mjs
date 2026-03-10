import Fastify from 'fastify';
import { handleAdaptationHttpRoute } from '../dist/src/modules/adaptation/phase3/adaptationFrameworkBindings.js';

const port = Number(process.env.ADAPTATION_PORT || 3040);
const host = process.env.ADAPTATION_HOST || '127.0.0.1';
const auditFilePath = process.env.ADAPTATION_AUDIT_FILE || './data/adaptation-evaluations.json';

const app = Fastify({ logger: true });

app.post('/adaptation/evaluate', async (request, reply) => {
  const response = await handleAdaptationHttpRoute(
    { body: request.body },
    { auditFilePath },
  );

  return reply.code(response.status).send(response.json);
});

try {
  await app.listen({ port, host });
  app.log.info(`Adaptation runtime listening at http://${host}:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
