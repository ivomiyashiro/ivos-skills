import { env } from '@shared/config/env';
import type { Db } from '@shared/db/client';
import { buildDb, resolveDbClientOptions } from '@shared/db/client';
import { createTransactionManager } from '@shared/db/transaction';
import { createEventBus } from '@shared/events/event-bus';
import { baseLogger } from '@shared/observability/logger';
import { DrizzleExampleRepository } from '@features/examples/repository/drizzle-example.repository';
import { ExampleReadModel } from '@features/examples/repository/example-read-model';

export type Clock = { now: () => Date };
export const systemClock: Clock = { now: () => new Date() };

/**
 * Composition root manual. Construir una vez en server.ts y pasar a buildApp().
 */
export const createContainer = () => {
  const { db, close } = buildDb(env.DATABASE_URL, resolveDbClientOptions({
    poolMax: env.DB_POOL_MAX,
    prepare: env.DB_PREPARE,
    transactionPooler: env.SUPABASE_TRANSACTION_POOLER,
  }));
  const appDb: Db = db;
  const logger = baseLogger;
  const tx = createTransactionManager(appDb);
  const eventBus = createEventBus();

  const exampleRepo = new DrizzleExampleRepository(appDb);
  const exampleReadModel = new ExampleReadModel(appDb);

  return {
    db: appDb,
    closeDb: close,
    logger,
    tx,
    eventBus,
    clock: systemClock,
    exampleRepo,
    createExampleRepository: (txDb: Db) => new DrizzleExampleRepository(txDb),
    exampleReadModel,
  };
};

export type AppContainer = ReturnType<typeof createContainer>;
