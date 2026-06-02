# Observability

## Stack

- **Logs:** Pino (structured JSON, child loggers).
- **Métricas:** prom-client (`/metrics` endpoint).
- **Tracing:** OpenTelemetry (opcional, ver al final).
- **Request correlation:** `X-Request-Id` propagado via middleware.

## Logger

```ts
// shared/observability/logger.ts
import pino from 'pino';
import { env } from '@shared/config/env';

export const baseLogger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'api', env: env.NODE_ENV },
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss.l' },
    },
  }),
});
```

- **Dev:** pino-pretty para legibilidad humana.
- **Prod:** JSON directo a stdout. El recolector (Loki, Datadog, etc.) lo parsea.

## Child logger por request

Middleware `logger.ts`:

```ts
const logger = baseLogger.child({
  requestId: c.get('requestId'),
  path: c.req.path,
  method: c.req.method,
});
c.set('logger', logger);
```

Toda línea de log dentro del request lleva `requestId`, `path`, `method` automáticamente.
Filtrar logs por request en Grafana se vuelve trivial.

## Niveles

| Level | Cuándo |
|---|---|
| `fatal` | El proceso no puede continuar. Antes de `process.exit(1)`. |
| `error` | Error inesperado (throw atrapado por `onError`). |
| `warn` | Condición sospechosa (rate limit cerca del límite, retry). |
| `info` | Eventos importantes (request, comando ejecutado, evento publicado). |
| `debug` | Detalles para troubleshooting (query, payload truncado). |
| `trace` | Volúmen alto, datos por request (off en prod). |

Default prod: `info`. Default dev: `debug`.

## Datos sensibles

Pino tiene `redact` para PII:

```ts
pino({
  redact: ['req.headers.authorization', 'password', 'token', '*.cardNumber'],
});
```

O nunca loguear el payload completo:

```ts
logger.info({ userId, action: 'create' }, 'X created');
// NO: logger.info({ payload: req.body }, '...')
```

## Métricas

```ts
// shared/observability/metrics.ts
import { Counter, Histogram, Registry } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });  // CPU, mem, event loop, GC

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});
```

El middleware `logger.ts` registra ambas en cada request.

`/metrics` lo sirve `metricsHandler` montado en `app.ts`. Prometheus scrapea cada 15s
default.

## Custom métricas

Por modulo:

```ts
// modules/quotes/quotes.metrics.ts
import { Counter, registry } from '@shared/observability/metrics';

export const quotesCreatedTotal = new Counter({
  name: 'quotes_created_total',
  help: 'Total de quotes creadas',
  labelNames: ['status'],
  registers: [registry],
});
```

Y en el command handler:

```ts
quotesCreatedTotal.inc({ status: 'draft' });
```

## Health checks

```ts
app.get('/healthz', (c) => c.json({ status: 'ok' }));
app.get('/readyz', (c) => c.json({ ready: !shuttingDown }, shuttingDown ? 503 : 200));
```

- `/healthz`: el proceso está vivo. K8s liveness probe.
- `/readyz`: el proceso acepta tráfico. K8s readiness probe. Flip a 503 durante shutdown.

Si querés un health check "deep" (DB alcanzable):

```ts
app.get('/healthz/deep', async (c) => {
  try {
    await c.get('db').execute(sql`SELECT 1`);
    return c.json({ status: 'ok' });
  } catch (err) {
    return c.json({ status: 'degraded', error: String(err) }, 503);
  }
});
```

(Pero usar con cuidado — un healthz deep que falla puede tumbar todo el cluster.)

## Tracing (OpenTelemetry, opcional)

Setup:

```bash
bun add @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

```ts
// shared/observability/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  serviceName: 'api',
  instrumentations: [getNodeAutoInstrumentations()],
});

if (env.OTEL_ENABLED) sdk.start();
```

Trazas se propagan via headers `traceparent` automáticamente (W3C). El logger
puede inyectar `trace_id` para correlacionar:

```ts
import { trace } from '@opentelemetry/api';
const span = trace.getActiveSpan();
const logger = baseLogger.child({
  requestId,
  traceId: span?.spanContext().traceId,
});
```

## Anti-patrones

- ❌ `console.log` en handlers. Usar `c.get('logger')`.
- ❌ Loguear el body completo del request. Filtrar a campos necesarios.
- ❌ Loguear PII sin redact.
- ❌ Métricas con cardinality explosiva (label `userId` con millones de valores).
  Mantener labels acotados (`method`, `route`, `status`).
- ❌ Healthz deep que page por DB temporalmente lenta. Probes deben ser baratos
  y tolerantes.
