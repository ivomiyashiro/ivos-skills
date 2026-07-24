import { afterEach, describe, expect, test } from 'bun:test';
import { buildApp } from '@/app';
import { createTestContainer } from '@test/helpers';
import type { AppDependencies } from '@/di-container';

describe('examples HTTP integration', () => {
  let dependencies: AppDependencies | undefined;

  afterEach(async () => {
    await dependencies?.closeDb();
    dependencies = undefined;
  });

  test('creates and lists examples against Postgres', async () => {
    dependencies = await createTestContainer();
    const app = buildApp(dependencies);

    const created = await app.request('/examples', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Integration example', total: 12.5 }),
    });

    expect(created.status).toBe(201);
    expect(await app.request('/examples')).toHaveProperty('status', 200);
  });
});
