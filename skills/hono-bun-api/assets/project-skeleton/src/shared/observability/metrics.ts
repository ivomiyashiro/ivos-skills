import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import type { Context } from 'hono';
import type { AppEnv } from '@shared/hono/types';

/**
 * Registry de métricas Prometheus. Métricas default (cpu, memoria, event loop)
 * + counters/histograms HTTP custom.
 */
export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requests HTTP',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de requests HTTP en segundos',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

/** Handler para /metrics. Devuelve el contenido del registry. */
export const metricsHandler = async (c: Context<AppEnv>) =>
  c.text(await registry.metrics(), 200, {
    'Content-Type': registry.contentType,
  });
