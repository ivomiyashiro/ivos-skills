import { describe, expect, test } from 'bun:test';
import { buildApp } from '@/app';
import { createTestContainer } from '@test/helpers';

describe('examples routes', () => {
  test('GET /examples returns a list', async () => {
    const dependencies = await createTestContainer();
    const app = buildApp(dependencies);

    const res = await app.request('/examples');

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ items: [] });
  });
});
