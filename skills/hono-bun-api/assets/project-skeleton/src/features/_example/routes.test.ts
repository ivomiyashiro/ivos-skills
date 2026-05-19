import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { buildApp, systemClock } from '@/app';
import { createEventBus } from '@shared/events/event-bus';
import { silentLogger } from '@test/helpers';
import { buildTestDb } from '@test/helpers/db';

/**
 * Tests de integración usando Hono `app.request(url, init)` (sin port binding)
 * + pglite (Postgres in-process). Para tests que necesitan features Postgres no
 * cubiertos por pglite, ver testcontainers en references/testing.md.
 */

let app: ReturnType<typeof buildApp>;
let closeDb: () => Promise<void>;

beforeAll(async () => {
  const testDb = await buildTestDb();
  closeDb = testDb.close;
  app = buildApp({
    db: testDb.db,
    logger: silentLogger,
    eventBus: createEventBus(),
    clock: systemClock,
  });
});

afterAll(async () => {
  await closeDb();
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
  test('201 con input válido', async () => {
    const res = await app.request('/examples', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'hola', total: 10 }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: string;
      name: string;
      status: string;
      total: number;
    };
    expect(body.name).toBe('hola');
    expect(body.status).toBe('draft');
    expect(body.total).toBe(10);
  });

  test('422 con body inválido (name vacío)', async () => {
    const res = await app.request('/examples', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { kind: string };
    expect(body.kind).toBe('Validation');
  });
});

describe('GET /examples/:id', () => {
  test('422 con UUID inválido (validación de param)', async () => {
    const res = await app.request('/examples/not-a-uuid');
    expect(res.status).toBe(422);
    const body = (await res.json()) as { kind: string; issues: unknown[] };
    expect(body.kind).toBe('Validation');
    expect(Array.isArray(body.issues)).toBe(true);
  });

  test('404 con UUID válido pero inexistente', async () => {
    const res = await app.request(`/examples/${crypto.randomUUID()}`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { kind: string; resource: string };
    expect(body.kind).toBe('NotFound');
    expect(body.resource).toBe('Example');
  });
});
