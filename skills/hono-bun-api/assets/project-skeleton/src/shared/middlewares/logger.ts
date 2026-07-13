import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '@shared/hono/types';
import { baseLogger } from '@shared/observability/logger';
import { httpRequestsTotal, httpRequestDurationSeconds } from '@shared/observability/metrics';

export const metricRouteLabel = (routePath: string | undefined) => routePath ?? 'unmatched';

/**
 * Logger middleware: crea un child logger con requestId, path y method.
 * Loguea inicio y fin del request, mide duración y registra métrica Prometheus.
 *
 * Requiere que `requestId` middleware haya corrido antes.
 */
export const loggerMiddleware = (): MiddlewareHandler<AppEnv> => async (c, next) => {
  const requestId = c.get('requestId');
  const logger = baseLogger.child({
    requestId,
    path: c.req.path,
    method: c.req.method,
  });
  c.set('logger', logger);

  const start = performance.now();
  logger.info('request started');

  await next();

  const durationMs = performance.now() - start;
  const durationSec = durationMs / 1000;
  const status = c.res.status;
  const route = metricRouteLabel(c.req.routePath);

  httpRequestsTotal.inc({ method: c.req.method, route, status: String(status) });
  httpRequestDurationSeconds.observe(
    { method: c.req.method, route, status: String(status) },
    durationSec,
  );

  logger.info({ status, durationMs: Math.round(durationMs * 100) / 100 }, 'request completed');
};
