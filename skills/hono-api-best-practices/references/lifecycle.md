# Lifecycle: boot, signals, graceful shutdown

## Bun.serve

```ts
// server.ts
const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
  idleTimeout: 30,  // segundos
});
```

`app.fetch` es el handler unificado. Hono lo expone listo para Bun.

## Health probes

```ts
// app.ts
app.get('/healthz', (c) => c.json({ status: 'ok' }));

// server.ts (depende del flag de cierre)
app.get('/readyz', (c) =>
  c.json({ ready: !shuttingDown }, shuttingDown ? 503 : 200),
);
```

- `/healthz` — proceso vivo (K8s liveness).
- `/readyz` — acepta tráfico (K8s readiness; 503 durante shutdown).

## Graceful shutdown

```ts
let shuttingDown = false;

const shutdown = async (signal: string) => {
  if (shuttingDown) return;  // idempotente
  shuttingDown = true;
  logger.info({ signal }, 'shutting down');

  // 1. Esperar a que el LB note /readyz=503 antes de cerrar.
  await Bun.sleep(env.SHUTDOWN_GRACE_MS);

  // 2. Stop accepting new connections, finish in-flight requests.
  server.stop(false);  // false = NO close active connections

  // 3. Cerrar pool DB (postgres.js .end()).
  try {
    // Si tenés acceso al client crudo:
    // await postgresClient.end({ timeout: 5 });
  } catch (err) {
    logger.error({ err }, 'error closing db');
  }

  logger.info('shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### Secuencia detallada

1. **Pod recibe SIGTERM** (K8s rolling deploy, scale down, etc.).
2. **shutdown(signal)** corre:
   - `shuttingDown = true` → /readyz responde 503.
3. **Grace period** (`SHUTDOWN_GRACE_MS`, default 2s):
   - El LB hace readiness probe, ve 503, deja de mandar tráfico.
   - Las requests in-flight siguen.
4. **server.stop(false)** :
   - No acepta conexiones nuevas.
   - Espera que las in-flight terminen.
5. **Close DB pool** :
   - Devuelve las conexiones al server Postgres.
6. **process.exit(0)** .

Si pasa el `terminationGracePeriodSeconds` (default 30s en K8s), recibe SIGKILL.

## Uncaught errors

```ts
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  process.exit(1);
});
```

Crash inmediato. K8s reinicia. No queremos un proceso en estado inconsistente.

## Startup checks (opcional)

Validar dependencias antes de servir tráfico:

```ts
// server.ts
try {
  await db.execute(sql`SELECT 1`);
  logger.info('db reachable');
} catch (err) {
  logger.fatal({ err }, 'db unreachable, refusing to start');
  process.exit(1);
}

const server = Bun.serve({ /* ... */ });
```

Trade-off: si la DB tarda en estar lista (deploy paralelo), el server crashea y
K8s reintenta. Aceptable para apps que requieren DB.

## Bun.serve options útiles

```ts
Bun.serve({
  port,
  fetch: app.fetch,
  idleTimeout: 30,                  // segundos sin actividad → close
  maxRequestBodySize: 10 * 1024 * 1024,  // 10MB
  development: env.NODE_ENV === 'development',  // hot reload + better errors
  error(err) {
    // último resort si app.fetch tira
    logger.error({ err }, 'serve error');
    return new Response('Internal Error', { status: 500 });
  },
});
```

## Reusing connections (multi-core)

Bun no tiene un cluster mode oficial todavía. Para usar todos los cores:
- Correr múltiples instancias detrás de un LB (k8s replicas).
- O usar `reusePort: true` en Bun.serve (permite múltiples procesos en el mismo port).

```ts
Bun.serve({ port, fetch: app.fetch, reusePort: true });
```

Útil con `pm2` o un launcher simple que arranque N procesos.

## Hot reload en dev

```bash
bun --watch run src/server.ts
```

Watch detecta cambios y restartea. Ya está en `package.json` como `bun run dev`.

## Memory leaks

Bun reporta heap via:

```bash
bun --inspect run src/server.ts
```

Conectar Chrome devtools al port del inspector. Para producción, `prom-client`
`collectDefaultMetrics` expone `nodejs_heap_size_used_bytes` y similares.

## Timeouts por request

Si un handler queda colgado, el `idleTimeout` no lo mata (es por connection idle).
Para timeout por handler:

```ts
// shared/middlewares/timeout.ts
import type { MiddlewareHandler } from 'hono';

export const timeout = (ms: number): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms),
    );
    await Promise.race([next(), timeoutPromise]);
  };

// app.ts
app.use('*', timeout(env.REQUEST_TIMEOUT_MS));
```

Cuidado: si el handler ya escribió response parcial, abortar el timeout puede dejar
estado inconsistente. Para llamadas a DB, mejor cancelar la query (postgres.js
soporta `AbortSignal`).

## Anti-patrones

- ❌ `process.exit(0)` sin esperar in-flight. Cuts off responses a mitad.
- ❌ `server.stop(true)` (close active connections). Mata requests que están
  respondiendo.
- ❌ Ignorar SIGTERM. K8s te va a mandar SIGKILL después del grace period.
- ❌ Setup pesado en boot (cargar todo el dataset en memoria). Aumenta el tiempo
  entre que el pod arranca y `/healthz` responde 200.
- ❌ /healthz que toca DB. Si la DB está lenta, K8s mata el pod sano. Health debe
  ser barato.
