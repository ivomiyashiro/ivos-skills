import { env } from '@shared/config/env';
import { buildApp } from './app';
import { createContainer } from './container';
import { shutdownGracefully } from '@shared/utils/shutdown';

const container = createContainer();
const app = buildApp(container);
const logger = container.logger;

let shuttingDown = false;

app.get('/readyz', (c) =>
  c.json({ ready: !shuttingDown }, shuttingDown ? 503 : 200),
);

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
  idleTimeout: 30,
  maxRequestBodySize: env.REQUEST_BODY_LIMIT_BYTES,
});

logger.info({ port: env.PORT, env: env.NODE_ENV }, 'server started');

const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutting down');

  try {
    await shutdownGracefully({
      stopServer: () => server.stop(false),
      wait: Bun.sleep,
      closeDb: () => container.closeDb(5),
      graceMs: env.SHUTDOWN_GRACE_MS,
    });
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
