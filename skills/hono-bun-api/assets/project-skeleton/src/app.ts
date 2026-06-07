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

  app.route('/examples', buildExamplesRoutes(container));

  mountDocs(app);

  return app;
};

export type AppType = ReturnType<typeof buildApp>;
