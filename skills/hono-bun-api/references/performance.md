# Performance Por Endpoint

Performance no es una etapa posterior al endpoint. Para APIs con Hono + Bun, la
mayor parte del costo aparece en DB, payloads, N+1 y llamadas externas.

## Checklist

Antes de cerrar un endpoint:

- DTO proyectado con campos explícitos; no `select *`.
- `limit` máximo en queries listables.
- Cursor pagination si la tabla puede crecer.
- Filtro de tenant/organization en SQL.
- Orden estable con desempate por `id`.
- Índice compatible con filtros + orden.
- Sin N+1 obvio.
- Response payload chico y sin blobs innecesarios.
- Query compleja testeada contra Postgres real de Docker Compose.

## Índice Junto Al Endpoint

Diseñar el índice mientras se diseña el listado:

```txt
Endpoint:
GET /projects?status=active

Query:
where organization_id = ?
  and status = ?
order by created_at desc, id desc
limit ?

Index:
(organization_id, status, created_at desc, id desc)
```

Regla práctica:

- igualdad primero: tenant, status, owner
- rango después: fechas, score, amount
- orden al final: `created_at desc, id desc`
- incluir `id` como desempate estable

## N+1

Si el endpoint lista 50 items y luego hace una query por item, corregir antes de
cerrar:

- join/proyección directa
- batch query con `inArray`
- query con proyección directa; helper local solo si se reutiliza
- cache per-request si el mismo dato se repite dentro del request

## Cache

No meter Redis por default. Primero medir.

Usar cache cuando:

- la read es cara y estable
- la invalidación está definida
- el dato no depende de permisos finos difíciles de modelar

Preferir:

- cache HTTP para endpoints públicos
- per-request memoization para evitar lecturas repetidas
- cache de app/Redis recién cuando el patrón está probado

## Llamadas Externas

Ninguna llamada externa sin:

- timeout
- retry/backoff si es idempotente
- logs con requestId
- payloads sin secretos completos

Side effects durables van por outbox/worker, no dentro del request principal.

## Boundary Checks

El skeleton incluye `bun run check:boundaries`. Debe fallar si:

- `shared/*` importa `features/*`
- una feature importa internals de otra feature
- una feature importa cualquier subpath interno de otra feature

Permitido:

```ts
import { buildBillingRoutes } from '@features/billing';
```

No permitido:

```ts
import { getBillingSummaryQuery } from '@features/billing/use-cases/queries/get-billing-summary.query';
```
