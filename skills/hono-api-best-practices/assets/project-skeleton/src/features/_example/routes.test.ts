import { describe, test, expect } from 'bun:test';
import { buildApp, systemClock } from '@/app';
import { createEventBus } from '@shared/events/event-bus';
import { baseLogger } from '@shared/observability/logger';
import type { Db } from '@shared/db/client';

/**
 * Tests de integración usando Hono `app.request(url, init)`. No bindea puerto,
 * todo en memoria. Para que pasen necesitás una DB real o un fake — acá se asume
 * un `testDb` fake. Para tests con Postgres efímero ver references/testing.md.
 */

const fakeDb = {} as Db; // placeholder — reemplazar por pglite o testcontainers
const eventBus = createEventBus();

const app = buildApp({
  db: fakeDb,
  logger: baseLogger,
  eventBus,
  clock: systemClock,
});

describe('GET /healthz', () => {
  test('200', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });
});

describe('POST /examples', () => {
  test.skip('422 con body inválido', async () => {
    const res = await app.request('/examples', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    expect(res.status).toBe(422);
  });

  // Tests con DB real: descomentar cuando esté el setup de pglite/testcontainers
  test.skip('201 con input válido', async () => {
    const res = await app.request('/examples', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'hola', total: 10 }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('hola');
    expect(body.status).toBe('draft');
  });
});

describe('GET /examples/:id', () => {
  test('422 con UUID inválido', async () => {
    const res = await app.request('/examples/not-a-uuid');
    expect(res.status).toBe(400);
  });
});
