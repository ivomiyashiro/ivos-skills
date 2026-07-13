import { describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import { requestTimeout } from './request-timeout';

describe('requestTimeout', () => {
  test('returns 504 when the downstream handler exceeds the configured deadline', async () => {
    const app = new Hono();
    app.use('*', requestTimeout(5));
    app.get('/', async (c) => {
      await Bun.sleep(25);
      return c.text('slow');
    });

    const response = await app.request('/');

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ kind: 'RequestTimeout' });
  });

  test('allows handlers that finish before the configured deadline', async () => {
    const app = new Hono();
    app.use('*', requestTimeout(25));
    app.get('/', (c) => c.text('ok'));

    const response = await app.request('/');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });
});
