import { createApiRouter } from '@shared/hono/router';
import { env } from '@shared/config/env';
import { shouldExposeOperationalEndpoint } from '@shared/config/operational';
import { requestId } from '@shared/middlewares/request-id';
import { loggerMiddleware } from '@shared/middlewares/logger';
import { errorHandler } from '@shared/middlewares/error-handler';
import { authMiddleware, type VerifyFn } from '@shared/middlewares/auth';
import { rateLimit } from '@shared/middlewares/rate-limit';
import { requestTimeout } from '@shared/middlewares/request-timeout';
import { createSupabaseVerify } from '@shared/auth/supabase';
import { metricsHandler } from '@shared/observability/metrics';
import { mountDocs } from '@shared/openapi/docs';
import { buildExamplesRoutes } from '@features/examples';
import type { AppContainer } from './container';

/**
 * Construye la instancia de Hono con middlewares globales, probes, metrics,
 * docs y features montadas. Hono queda como adapter HTTP: la logica vive en
 * use-cases/repository/utils dentro de cada feature.
 */
export const buildApp = (container: AppContainer) => {
  const app = createApiRouter();

  app.use('*', async (c, next) => {
    c.set('db', container.db);
    await next();
  });

  app.use('*', requestId());
  app.use('*', loggerMiddleware());
  app.use('*', requestTimeout(env.REQUEST_TIMEOUT_MS));
  app.use('*', rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    maxBuckets: env.RATE_LIMIT_MAX_BUCKETS,
    trustProxy: env.TRUST_PROXY,
  }));

  const verify: VerifyFn = env.SUPABASE_JWKS_URL
    ? createSupabaseVerify({
        mode: 'jwks',
        jwksUri: env.SUPABASE_JWKS_URL,
        issuer: `${env.SUPABASE_URL}/auth/v1`,
        audience: 'authenticated',
        role: 'authenticated',
      })
    : env.SUPABASE_JWT_SECRET
    ? createSupabaseVerify({
        mode: 'hs256',
        jwtSecret: env.SUPABASE_JWT_SECRET,
        issuer: `${env.SUPABASE_URL}/auth/v1`,
        audience: 'authenticated',
        role: 'authenticated',
      })
    : async () => null;
  app.use('*', authMiddleware(verify));

  app.onError(errorHandler);

  app.get('/healthz', (c) => c.json({ status: 'ok' }));
  if (shouldExposeOperationalEndpoint(env.NODE_ENV, env.EXPOSE_METRICS)) {
    app.get('/metrics', metricsHandler);
  }

  app.route('/examples', buildExamplesRoutes(container));

  if (shouldExposeOperationalEndpoint(env.NODE_ENV, env.EXPOSE_DOCS)) {
    mountDocs(app);
  }

  return app;
};

export type AppType = ReturnType<typeof buildApp>;
