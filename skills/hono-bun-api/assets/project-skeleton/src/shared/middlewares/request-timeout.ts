import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '@shared/hono/types';

export const requestTimeout = (timeoutMs: number): MiddlewareHandler<AppEnv> => async (c, next) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const completed = await Promise.race([
    next().then(() => true),
    new Promise<false>((resolve) => {
      timeoutId = setTimeout(() => resolve(false), timeoutMs);
    }),
  ]);

  if (timeoutId) clearTimeout(timeoutId);
  if (!completed) return c.json({ kind: 'RequestTimeout' }, 504);
};
