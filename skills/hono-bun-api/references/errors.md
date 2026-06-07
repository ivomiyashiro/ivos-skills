# Errores Y Result

El default del skeleton usa `Result<T, AppError>` para errores esperados de negocio
en use cases. Esto hace explicito el contrato del caso de uso.

## Result

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Usar `success(value)` y `failure(error)` para consistencia.

## AppError

```ts
type AppError =
  | { kind: 'NotFound'; resource: string; id: string }
  | { kind: 'Unauthorized'; reason?: string }
  | { kind: 'Forbidden'; reason?: string }
  | { kind: 'Validation'; issues: ValidationIssue[] }
  | { kind: 'Conflict'; reason: string }
  | { kind: 'Unknown'; cause?: unknown };
```

`toHttpResponse` mapea `AppError` a status HTTP. Controllers no hacen `try/catch`
por cada error de negocio.

## Errores De Negocio

Utils/use-cases pueden expresar fallas como:
- error objects (`ProjectLimitReached`)
- policy results (`{ allowed: false, reason }`)
- value object factory result

El use case traduce esas fallas a `AppError`.

```ts
const decision = organization.canCreateProject(actorId);
if (!decision.allowed) {
  return failure(forbidden(decision.reason));
}
```

## Cuando Throw Es Correcto

Usar `throw` para:
- bugs de programador
- invariant breach que no deberia ser posible
- fallas de infraestructura
- config invalida al boot

El middleware global loguea stack y responde 500 neutro.

## Exceptions Tipadas Como Variante

Si el proyecto ya usa exceptions tipadas para negocio, se puede aceptar:
- una jerarquia chica de errores
- middleware mapper central
- nada de `try/catch` repetido en controllers

No mezclar `Result` y exceptions de negocio dentro de la misma feature sin una razón
clara. La consistencia vale mas que el estilo elegido.

## Anti-Patrones

- `throw new HttpException(404)` desde use-cases/utils
- errores HTTP dentro de entities
- devolver stack traces al cliente
- convertir todos los casos conocidos a `Unknown`
- `catch` generico en cada controller
