import { env } from '@shared/config/env';
import { buildApp } from './app';
import { createContainer } from './di-container';

const dependencies = createContainer();
const app = buildApp(dependencies);
const logger = dependencies.logger;

let shuttingDown = false;

app.get('/readyz', (c) =>
  c.json({ ready: !shuttingDown }, shuttingDown ? 503 : 200),
);

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
  idleTimeout: 30,
});

logger.info({ port: env.PORT, env: env.NODE_ENV }, 'server started');

const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutting down');

  await Bun.sleep(env.SHUTDOWN_GRACE_MS);

  server.stop(false);

  try {
    await dependencies.closeDb(5);
    logger.info('db pool closed');
  } catch (err) {
    logger.error({ err }, 'error closing db pool');
  }

  logger.info('shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandled rejection');
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  process.exit(1);
});
