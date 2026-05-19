import type { AppEnv } from '@shared/hono/types';
import { createApiRouter } from '@shared/hono/router';
import type { Db } from '@shared/db/client';
import type { Logger } from '@shared/observability/logger';
import type { EventBus } from '@shared/events/event-bus';
import { env } from '@shared/config/env';
import { requestId } from '@shared/middlewares/request-id';
import { loggerMiddleware } from '@shared/middlewares/logger';
import { errorHandler } from '@shared/middlewares/error-handler';
import { authMiddleware, type VerifyFn } from '@shared/middlewares/auth';
import { createSupabaseVerify } from '@shared/auth/supabase';
import { metricsHandler } from '@shared/observability/metrics';
import { mountDocs } from '@shared/openapi/docs';
import { buildExampleRoutes } from '@features/_example/routes';

/**
 * Clock — abstracción para tests determinísticos. Inyectarlo en lugar de usar
 * `new Date()` directo en commands.
 */
export type Clock = { now: () => Date };
export const systemClock: Clock = { now: () => new Date() };

/** Boot-time dependencies — construidas una vez en server.ts y compartidas. */
export type AppDeps = {
  db: Db;
  logger: Logger;
  eventBus: EventBus;
  clock: Clock;
};

/**
 * Construye la instancia de Hono completa con middlewares globales, healthz,
 * metrics, docs y todas las features mounteadas.
 *
 * Retorna OpenAPIHono para que server.ts pueda hacer .fetch y los tests
 * `app.request()`.
 */
export const buildApp = (deps: AppDeps) => {
  const app = createApiRouter();

  // Inyectar el handle de Db en c.var para que middlewares y handlers lo
  // accedan sin necesidad de un container.
  app.use('*', async (c, next) => {
    c.set('db', deps.db);
    await next();
  });

  // Orden importa: request-id ANTES de logger (logger usa requestId).
  app.use('*', requestId());
  app.use('*', loggerMiddleware());

  // Auth: si SUPABASE_JWT_SECRET está set, usar Supabase verify (HS256).
  // Sino, todas las requests caen como anónimas (auth = null) y los handlers
  // que requieran identidad fallarán con 401 via requireAuth.
  const verify: VerifyFn = env.SUPABASE_JWT_SECRET
    ? createSupabaseVerify({
        mode: 'hs256',
        jwtSecret: env.SUPABASE_JWT_SECRET,
        ...(env.SUPABASE_URL && { issuer: `${env.SUPABASE_URL}/auth/v1` }),
      })
    : async () => null;
  app.use('*', authMiddleware(verify));

  app.onError(errorHandler);

  // Probes — siempre 200 mientras el proceso esté vivo.
  app.get('/healthz', (c) => c.json({ status: 'ok' }));

  // /readyz lo maneja server.ts (depende del flag shuttingDown).
  // Metrics
  app.get('/metrics', metricsHandler);

  // Features
  app.route('/examples', buildExampleRoutes(deps));

  // OpenAPI docs (después de registrar features)
  mountDocs(app);

  return app;
};

/** Tipo exportado para que el cliente FE haga `hc<AppType>(baseUrl)`. */
export type AppType = ReturnType<typeof buildApp>;
