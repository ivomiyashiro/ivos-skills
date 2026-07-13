import pino from 'pino';
import type { EventBus, DomainEvent } from '@shared/events/event-bus';
import { createTransactionManager } from '@shared/db/transaction';
import { DrizzleExampleRepository } from '@features/examples/repository/drizzle-example.repository';
import { ExampleReadModel } from '@features/examples/repository/example-read-model';
import type { Clock } from '@/container';
import type { AppContainer } from '@/container';
import { buildTestDb } from './db';

/** Logger silencioso para tests. No imprime nada, no rompe el output. */
export const silentLogger = pino({ level: 'silent' });

/** EventBus no-op para tests que no inspeccionan eventos. */
export const noopBus: EventBus = {
  publish: async () => {},
  publishMany: async () => {},
  on: () => {},
  off: () => {},
};

/** Recolector de eventos para verificar publish calls en tests. */
export const createRecordingBus = () => {
  const events: DomainEvent[] = [];
  return {
    bus: {
      publish: async (e: DomainEvent) => { events.push(e); },
      publishMany: async (es: DomainEvent[]) => { events.push(...es); },
      on: () => {},
      off: () => {},
    } satisfies EventBus,
    events,
  };
};

/** Clock fijo para tests determinísticos. */
export const fixedClock = (date: Date | string = '2026-05-12T00:00:00Z'): Clock => ({
  now: () => (typeof date === 'string' ? new Date(date) : date),
});

export const createTestContainer = async (): Promise<AppContainer> => {
  const { db, close } = await buildTestDb();

  return {
    db,
    closeDb: close,
    logger: silentLogger,
    tx: createTransactionManager(db),
    eventBus: noopBus,
    clock: fixedClock(),
    exampleRepo: new DrizzleExampleRepository(db),
    createExampleRepository: (txDb: typeof db) => new DrizzleExampleRepository(txDb),
    exampleReadModel: new ExampleReadModel(db),
  };
};
