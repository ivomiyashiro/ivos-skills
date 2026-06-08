# Rate Limits Y Backpressure

Rate limit protege endpoints. Backpressure protege procesos y dependencias. Bun puede
aceptar mucho tráfico, pero DB/proveedores externos no siempre pueden acompañar.

## Cuándo Aplicar

- auth/login/signup
- endpoints públicos
- webhooks
- búsquedas/listados caros
- exports/reportes
- commands que llaman proveedores externos

## Tipos

| Tipo | Uso |
|---|---|
| IP-based | endpoints públicos/anon |
| actor-based | usuarios autenticados |
| tenant-based | fairness entre organizaciones |
| route-based | endpoints caros |
| concurrency limit | workers/jobs/proveedores externos |

## Skeleton

El skeleton incluye `shared/middlewares/rate-limit.ts` con limiter in-memory. Sirve
para desarrollo, apps de una instancia o como punto de partida. En producción con
varias instancias, usar Redis/Postgres o gateway/API edge.

```ts
app.use('/auth/*', rateLimit({ windowMs: 60_000, max: 20 }));
app.use('/search/*', rateLimit({
  windowMs: 60_000,
  max: 120,
  key: (c) => c.get('auth')?.userId ?? c.req.header('x-forwarded-for') ?? 'anon',
}));
```

## Backpressure En Workers

Workers deben tener:

- concurrencia máxima
- batch size
- backoff en errores
- dead-letter/error state
- shutdown graceful

```txt
poll 50 pending events
process with concurrency 5
retry failed with exponential backoff
mark failed after max attempts
```

## Anti-Patrones

- limiter in-memory en muchas réplicas como si fuera global
- sin límite en exports/reportes
- worker con `Promise.all` sobre miles de items
- retry inmediato infinito
- rate limit por `userId` como label de métrica Prometheus
