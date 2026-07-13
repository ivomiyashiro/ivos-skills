import { describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import { rateLimit } from './rate-limit';

const createApp = (options: Parameters<typeof rateLimit>[0]) => {
  const app = new Hono();
  app.use('*', rateLimit(options));
  app.get('/', (c) => c.text('ok'));
  return app;
};

describe('rateLimit', () => {
  test('does not trust x-forwarded-for unless explicitly configured', async () => {
    const app = createApp({ windowMs: 60_000, max: 1 });

    expect((await app.request('/', { headers: { 'x-forwarded-for': '203.0.113.1' } })).status).toBe(200);
    expect((await app.request('/', { headers: { 'x-forwarded-for': '203.0.113.2' } })).status).toBe(429);
  });

  test('uses x-forwarded-for only when proxy trust is enabled', async () => {
    const app = createApp({ windowMs: 60_000, max: 1, trustProxy: true });

    expect((await app.request('/', { headers: { 'x-forwarded-for': '203.0.113.1' } })).status).toBe(200);
    expect((await app.request('/', { headers: { 'x-forwarded-for': '203.0.113.2' } })).status).toBe(200);
  });

  test('evicts the oldest bucket when its cardinality cap is reached', async () => {
    let now = 0;
    const app = createApp({
      windowMs: 60_000,
      max: 1,
      maxBuckets: 2,
      key: (c) => c.req.header('x-client') ?? 'anonymous',
      now: () => now++,
    });

    expect((await app.request('/', { headers: { 'x-client': 'one' } })).status).toBe(200);
    expect((await app.request('/', { headers: { 'x-client': 'two' } })).status).toBe(200);
    expect((await app.request('/', { headers: { 'x-client': 'three' } })).status).toBe(200);
    expect((await app.request('/', { headers: { 'x-client': 'one' } })).status).toBe(200);
  });

  test('removes expired buckets before admitting new identities', async () => {
    let now = 0;
    const app = createApp({
      windowMs: 100,
      max: 1,
      maxBuckets: 1,
      key: (c) => c.req.header('x-client') ?? 'anonymous',
      now: () => now,
    });

    expect((await app.request('/', { headers: { 'x-client': 'one' } })).status).toBe(200);
    now = 101;
    expect((await app.request('/', { headers: { 'x-client': 'two' } })).status).toBe(200);
  });
});
