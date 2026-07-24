import { createApiRouter } from '@shared/hono/router';
import { env } from '@shared/config/env';
import { requestId } from '@shared/middlewares/request-id';
import { loggerMiddleware } from '@shared/middlewares/logger';
import { errorHandler } from '@shared/middlewares/error-handler';
import { authMiddleware, type VerifyFn } from '@shared/middlewares/auth';
import { createSupabaseVerify } from '@shared/auth/supabase';
import { metricsHandler } from '@shared/observability/metrics';
import { mountDocs } from '@shared/openapi/docs';
import { buildExamplesRoutes } from '@features/examples';
import type { AppDependencies } from './di-container';

/**
 * Construye la instancia de Hono con middlewares globales, probes, metrics,
 * docs and mounted features. Each feature route file is its only HTTP adapter.
 */
export const buildApp = (dependencies: AppDependencies) => {
  const app = createApiRouter();

  app.use('*', async (c, next) => {
    c.set('db', dependencies.db);
    await next();
  });

  app.use('*', requestId());
  app.use('*', loggerMiddleware());

  const verify: VerifyFn = env.SUPABASE_JWT_SECRET
    ? createSupabaseVerify({
        mode: 'hs256',
        jwtSecret: env.SUPABASE_JWT_SECRET,
        ...(env.SUPABASE_URL && { issuer: `${env.SUPABASE_URL}/auth/v1` }),
      })
    : async () => null;
  app.use('*', authMiddleware(verify));

  app.onError(errorHandler);

  app.get('/healthz', (c) => c.json({ status: 'ok' }));
  app.get('/metrics', metricsHandler);

  app.route(
    '/examples',
    buildExamplesRoutes({
      db: dependencies.db,
      tx: dependencies.tx,
      eventBus: dependencies.eventBus,
      clock: dependencies.clock,
    }),
  );

  mountDocs(app);

  return app;
};

export type AppType = ReturnType<typeof buildApp>;
