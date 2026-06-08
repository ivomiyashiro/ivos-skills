import type { Context, MiddlewareHandler } from 'hono';
import type { AppEnv } from '@shared/hono/types';

type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  key?: (c: Context<AppEnv>) => string;
};

const defaultKey = (c: Context<AppEnv>) =>
  c.get('auth')?.userId ??
  c.req.header('x-forwarded-for') ??
  c.req.header('cf-connecting-ip') ??
  'anonymous';

/**
 * In-memory rate limit. Útil para desarrollo o una sola instancia.
 * En producción multi-instancia usar Redis/Postgres/gateway.
 */
export const rateLimit = (options: RateLimitOptions): MiddlewareHandler<AppEnv> => {
  const buckets = new Map<string, Bucket>();
  const keyFn = options.key ?? defaultKey;

  return async (c, next) => {
    const now = Date.now();
    const key = keyFn(c);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      await next();
      return;
    }

    if (bucket.count >= options.max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfterSeconds));
      return c.json({ kind: 'TooManyRequests', retryAfterSeconds }, 429);
    }

    bucket.count += 1;
    await next();
  };
};
