import { describe, expect, test } from 'bun:test';
import pino from 'pino';
import { Hono } from 'hono';
import type { Db } from '@shared/db/client';
import { createEventBus } from '@shared/events/event-bus';
import type { AppEnv } from '@shared/hono/types';
import { buildExamplesRoutes } from './examples.routes';
import type { ExampleUseCasesDeps } from '../use-cases/examples.use-cases';

const createInMemoryDeps = (): ExampleUseCasesDeps => {
  const db = {} as Db;

  return {
    createExampleRepository: () => ({
      findById: async () => null,
      save: async () => undefined,
      delete: async () => undefined,
    }),
    exampleReadModel: {
      getById: async () => null,
      list: async () => ({ items: [], nextCursor: null }),
    },
    tx: {
      run: async <T>(operation: (tx: Db) => Promise<T>) => operation(db),
    },
    eventBus: createEventBus(),
    logger: pino({ enabled: false }),
    clock: { now: () => new Date('2026-01-01T00:00:00.000Z') },
  };
};

describe('examples routes', () => {
  test('GET /examples rejects anonymous requests and lists for authenticated users', async () => {
    const deps = createInMemoryDeps();
    const anonymousApp = new Hono<AppEnv>();
    anonymousApp.route('/examples', buildExamplesRoutes(deps));

    const anonymous = await anonymousApp.request('/examples');
    expect(anonymous.status).toBe(401);
    expect(await anonymous.json()).toMatchObject({ kind: 'Unauthorized' });

    const authenticatedApp = new Hono<AppEnv>();
    authenticatedApp.use('*', async (c, next) => {
      c.set('auth', { userId: '00000000-0000-4000-8000-000000000001', roles: [] });
      await next();
    });
    authenticatedApp.route('/examples', buildExamplesRoutes(deps));

    const authenticated = await authenticatedApp.request('/examples');
    expect(authenticated.status).toBe(200);
    expect(await authenticated.json()).toEqual({ items: [], nextCursor: null });
  });
});
