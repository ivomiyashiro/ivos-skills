import { env } from '@shared/config/env';
import { baseLogger } from '@shared/observability/logger';
import { buildDb } from '@shared/db/client';
import { createEventBus } from '@shared/events/event-bus';
import { buildApp, systemClock } from './app';

/**
 * Entry point. Construye las dependencias boot-time, arranca Bun.serve,
 * registra handlers SIGTERM/SIGINT para graceful shutdown que cierra el pool.
 */

const logger = baseLogger;
const { db, close: closeDb } = buildDb(env.DATABASE_URL);
const eventBus = createEventBus();

const app = buildApp({ db, logger, eventBus, clock: systemClock });

let shuttingDown = false;

// /readyz se define acá porque depende del flag de cierre.
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

  // Grace para que el LB note /readyz=503 antes de cerrar conexiones.
  await Bun.sleep(env.SHUTDOWN_GRACE_MS);

  server.stop(false);

  try {
    await closeDb(5);
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
