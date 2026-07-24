import pino from 'pino';
import type { EventBus, DomainEvent } from '@shared/events/event-bus';
import { createTransactionManager } from '@shared/db/transaction';
import type { Clock } from '@/di-container';
import type { AppDependencies } from '@/di-container';
import { buildTestDb } from './db';

/** Silent logger for tests. */
export const silentLogger = pino({ level: 'silent' });

/** No-op event bus for tests that do not inspect events. */
export const noopBus: EventBus = {
  publish: () => {},
  publishMany: () => {},
  on: () => {},
  off: () => {},
};

/** Event collector for publish assertions. */
export const createRecordingBus = () => {
  const events: DomainEvent[] = [];
  return {
    bus: {
      publish: (e: DomainEvent) => events.push(e),
      publishMany: (es: DomainEvent[]) => events.push(...es),
      on: () => {},
      off: () => {},
    } satisfies EventBus,
    events,
  };
};

/** Fixed clock for deterministic tests. */
export const fixedClock = (date: Date | string = '2026-05-12T00:00:00Z'): Clock => ({
  now: () => (typeof date === 'string' ? new Date(date) : date),
});

export const createTestContainer = async (): Promise<AppDependencies> => {
  const { db, close } = await buildTestDb();

  return {
    db,
    closeDb: close,
    logger: silentLogger,
    tx: createTransactionManager(db),
    eventBus: noopBus,
    clock: fixedClock(),
  };
};
