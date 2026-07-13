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
  maxBuckets?: number;
  now?: () => number;
  trustProxy?: boolean;
};

const defaultKey = (trustProxy: boolean) => (c: Context<AppEnv>) => {
  const authenticatedKey = c.get('auth')?.userId;
  if (authenticatedKey) return authenticatedKey;

  if (trustProxy) {
    const forwardedFor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwardedFor) return forwardedFor;
  }

  return 'anonymous';
};

/**
 * In-memory rate limit. Útil para desarrollo o una sola instancia.
 * En producción multi-instancia usar Redis/Postgres/gateway.
 */
export const rateLimit = (options: RateLimitOptions): MiddlewareHandler<AppEnv> => {
  const buckets = new Map<string, Bucket>();
  const keyFn = options.key ?? defaultKey(options.trustProxy ?? false);
  const maxBuckets = options.maxBuckets ?? 10_000;
  const nowFn = options.now ?? Date.now;

  return async (c, next) => {
    const now = nowFn();
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }

    const key = keyFn(c);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      if (buckets.size >= maxBuckets) {
        let oldestKey: string | undefined;
        let oldestResetAt = Number.POSITIVE_INFINITY;
        for (const [bucketKey, currentBucket] of buckets) {
          if (currentBucket.resetAt < oldestResetAt) {
            oldestKey = bucketKey;
            oldestResetAt = currentBucket.resetAt;
          }
        }
        if (oldestKey) buckets.delete(oldestKey);
      }
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
