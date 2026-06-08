# Timeouts Y Retries

Toda llamada externa debe tener timeout. Retries solo cuando la operación es
idempotente o está protegida por idempotencia.

## Timeouts

Usar `AbortSignal` cuando el cliente lo soporte:

```ts
const result = await withTimeout(
  (signal) => fetch(url, { signal }),
  5_000,
);
```

El skeleton incluye `shared/utils/timeout.ts`.

## Retries

Retry con backoff para errores transitorios:

- `502`, `503`, `504`
- timeouts
- connection reset
- rate limit externo con `Retry-After`

No retry:

- `400`, `401`, `403`, `404`
- errores de validación
- pagos/creates sin idempotency key

## Backoff

```txt
attempt 1 -> 200ms
attempt 2 -> 400ms
attempt 3 -> 800ms
cap max -> 2s / 5s según proveedor
```

Agregar jitter si muchos workers pueden retryar al mismo tiempo.

## Propagación

Pasar `requestId` en headers hacia servicios internos:

```ts
headers: { 'x-request-id': requestId }
```

No reenviar tokens completos a logs.

## Anti-Patrones

- llamadas externas sin timeout
- retry de operaciones no idempotentes
- retry infinito
- sleeps dentro del request principal para trabajos largos
- esconder fallas externas como success silencioso
