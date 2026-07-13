import { describe, expect, test } from 'bun:test';
import { HTTPException } from 'hono/http-exception';
import { createApiRouter } from '@shared/hono/router';
import { errorHandler } from './error-handler';

describe('errorHandler', () => {
  test('preserves Hono HTTPException responses', async () => {
    const app = createApiRouter();
    app.onError(errorHandler);
    app.get('/teapot', () => {
      throw new HTTPException(418, { message: 'short and stout' });
    });

    const response = await app.request('/teapot');

    expect(response.status).toBe(418);
    expect(await response.text()).toBe('short and stout');
  });
});
