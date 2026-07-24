import { env } from '@shared/config/env';
import type { Db } from '@shared/db/client';
import { buildDb } from '@shared/db/client';
import { createTransactionManager } from '@shared/db/transaction';
import { createEventBus } from '@shared/events/event-bus';
import { baseLogger } from '@shared/observability/logger';

export type Clock = { now: () => Date };
export const systemClock: Clock = { now: () => new Date() };

/**
 * Composition root manual. Construir una vez en server.ts y pasar a buildApp().
 */
export const createContainer = () => {
  const { db, close } = buildDb(env.DATABASE_URL);
  const appDb: Db = db;
  const logger = baseLogger;
  const tx = createTransactionManager(appDb);
  const eventBus = createEventBus();

  return {
    db: appDb,
    closeDb: close,
    logger,
    tx,
    eventBus,
    clock: systemClock,
  };
};

export type AppDependencies = ReturnType<typeof createContainer>;
