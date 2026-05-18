# Errors y Result pattern

## La filosofía

- **Result<T, E>** para errores de **negocio** que el caller puede manejar.
- **`throw`** SOLO para errores de **programador** (bugs, libs que fallan, panics).
- Cada handler retorna `Promise<Result<Out, AppError>>`.

## Result<T, E>

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const success = <T>(value: T): Result<T, never> => ({ ok: true, value });
const failure = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

Plain discriminated union. Sin librería externa.

**Por qué no `neverthrow`:**
- Una dep menos.
- API más simple (no `.map().andThen().match()`).
- Espeja el Result de .NET que ya usás (`response-pattern` skill).

Si en el futuro necesitás chaining (`map`, `flatMap`), están exportados en
`result.ts` como helpers planos.

## AppError tagged union

```ts
type AppError =
  | { kind: 'NotFound'; resource: string; id: string }
  | { kind: 'Unauthorized'; reason?: string }
  | { kind: 'Forbidden'; reason?: string }
  | { kind: 'Validation'; issues: ValidationIssue[] }
  | { kind: 'Conflict'; reason: string }
  | { kind: 'Unknown'; cause?: unknown };
```

Discriminant es `kind`. TypeScript narrowa con switch exhaustivo.

## Helpers de construcción

```ts
notFound('Quote', id)
unauthorized('invalid token')
forbidden('missing role: admin')
validation([{ path: 'amount', message: 'over limit' }])
conflict('quote already cancelled')
unknown(err)
```

Usar estos en lugar de literal objects para consistencia.

## Mapeo a HTTP

`toHttpResponse(c, result, successStatus)` hace switch sobre `kind`:

| kind | Status |
|---|---|
| `NotFound` | 404 |
| `Unauthorized` | 401 |
| `Forbidden` | 403 |
| `Validation` | 422 |
| `Conflict` | 409 |
| `Unknown` | 500 |
| success | `successStatus` (default 200) |

Switch exhaustivo: si agregás un kind nuevo a AppError, TS forza agregar el caso
en to-http.ts.

## Ejemplo de retorno

```ts
const handler = async (deps, input) => {
  if (input.amount < 0) {
    return failure(validation([{ path: 'amount', message: 'must be positive' }]));
  }
  const existing = await deps.repo.findById(input.id);
  if (!existing) return failure(notFound('X', input.id));
  if (existing.status === 'archived') {
    return failure(conflict('cannot modify archived'));
  }
  await deps.repo.save({ ...existing, ...input });
  return success(toDto(existing));
};
```

## Cuando SÍ `throw`

- Bug de programación (e.g., asserting invariantes que no deberían poder pasar).
- Falla de infraestructura (DB connection lost, lib externa).
- Configuración inválida al boot.

Esos throws los atrapa `app.onError` (`shared/middlewares/error-handler.ts`),
loguea con stack, y devuelve 500 con un body neutro `{ kind: 'Unknown', requestId }`.

## Anti-patrones

- ❌ `throw new HttpException(404, 'not found')`. Tipo de retorno miente y se
  pierde el switch exhaustivo.
- ❌ Convertir errores comunes en `Unknown`. Cada caso conocido tiene su kind.
- ❌ Filtrar detalles internos en el body de respuesta (stack trace, query, etc.).
  Loguear sí; devolver al cliente no.
- ❌ Custom error class: `class NotFoundError extends Error`. Funciona, pero el
  switch exhaustivo no escala con `instanceof` chains.
- ❌ Olvidar mapear un kind nuevo: agregar a `AppError` debe forzar agregar a
  `to-http.ts`. Mantené el switch exhaustivo (sin `default`).

## Result en otros idiomas

| | Acá (TS) | .NET (response-pattern) | Rust |
|---|---|---|---|
| Tipo | `Result<T, E>` | `Result<T>` | `Result<T, E>` |
| Ok | `{ ok: true, value }` | `Success` static factory | `Ok(value)` |
| Err | `{ ok: false, error }` | `Failure` static factory | `Err(error)` |
| Switch | `if (r.ok) ...` | `if (r.IsSuccess) ...` | `match r { Ok(v) => ... }` |

El mental model es el mismo. Estás reusando lo que ya sabés.

## Problem+JSON (opcional)

Si querés alinear con RFC 7807 (Problem Details for HTTP APIs):

```ts
export const toProblemJson = (c, result) => {
  if (result.ok) return c.json(result.value, 200);
  const err = result.error;
  return c.json(
    {
      type: `https://errors.example.com/${err.kind}`,
      title: err.kind,
      status: statusForKind(err.kind),
      detail: 'reason' in err ? err.reason : undefined,
      instance: c.req.path,
      requestId: c.get('requestId'),
      ...err,
    },
    statusForKind(err.kind),
    { 'Content-Type': 'application/problem+json' },
  );
};
```

Mantenelo opcional — el `toHttpResponse` base con `kind` es más simple para empezar.
