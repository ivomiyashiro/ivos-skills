# Arquitectura: Features Verticales + CQRS Lite

## Modelo Mental

Usar un monolito con features verticales y limites claros:

```txt
HTTP / API
  -> <feature>.routes.ts
  -> command/query
  -> Database / Supabase / external services
```

El deploy sigue siendo simple, pero cada feature concentra lo que cambia junto. No
diseñar microservicios antes de que haya presión real de escala, ownership o
aislamiento operacional.

## Estructura Recomendada

```txt
features/projects/
  use-cases/
    commands/
    queries/
  __tests__/
  projects.constants.ts
  projects.errors.ts
  projects.events.ts
  projects.routes.ts
  projects.schemas.ts
  projects.types.ts
  index.ts
```

La navegación queda clara:

- Endpoint: `<feature>.routes.ts`
- Caso de uso: `use-cases/commands/` o `use-cases/queries/`
- SQL y mapping: la operación dueña, con Drizzle directo
- Tests HTTP/DB: `__tests__/`

## CQRS Lite

Lite significa:

- misma base de datos para reads y writes
- sin event sourcing por default
- sin proyecciones async obligatorias
- separación conceptual entre commands y queries
- commands y queries reciben deps explícitas
- writes y reads usan Drizzle directo por default y devuelven DTOs específicos

No agregar full CQRS salvo que haya una razón fuerte: auditoría inmutable, read load
extremo, proyecciones complejas o equipos con ownership separado.

## Dirección De Dependencias

```txt
features/<x>/<x>.routes.ts      -> use-cases + shared HTTP helpers
features/<x>/use-cases/commands -> shared db/events/errors
features/<x>/use-cases/queries  -> shared db/errors
shared/                     -> no importa features
```

Reglas:

- Commands y queries no importan Hono.
- `<feature>.routes.ts` es el adapter HTTP y puede importar Hono/Zod/shared HTTP helpers.
- Helpers o repositories extraídos no ocultan reglas de negocio ni deps; existen solo por complejidad o reutilización concreta.
- Una feature no importa internals de otra feature.
- Correr `bun run check:boundaries` para hacer estas reglas verificables.

## Coordinación Entre Features

Preferir:

1. Eventos para reaccionar a cambios.
2. Queries read-side con joins SQL cuando solo se necesita leer.
3. Servicios compartidos en `shared/` solo si son genuinamente cross-cutting.
4. API interna/externa si la feature fue extraída a otro servicio.

Evitar import directo de cualquier subpath interno de `features/A` desde
`features/B`. Eso crea acoplamiento oculto y hace más difícil extraer o testear.

## Reglas De Diseño

1. Una carpeta `features/<name>/` representa un bounded context chico o feature area.
2. Dividir la feature cuando sus casos de uso no comparten lenguaje ni invariantes.
3. Mantener `<feature>.routes.ts` fino: parse/validación/contexto/result HTTP.
4. Mantener commands y queries ejecutables desde HTTP, jobs o tests.
5. Poner invariantes en commands y helpers locales puros; no en routes.
6. Usar Drizzle directo por default; extraer helpers/repositories solo con evidencia de complejidad o reutilización.
7. Mantener queries con DTOs específicos para listados, dashboards, search y reports.
8. Mantener transacciones explícitas en writes críticas.

## Anti-Patrones

- Routes con reglas de negocio o SQL.
- `UserService` o `ProjectService` con decenas de métodos inconexos.
- Repositorios universales con `findAll`, `search`, `stats`, `dashboard`.
- Commands/queries llamando `c.req` o devolviendo `Response`.
- RLS como única autorización backend.
- Offset pagination en tablas grandes.
- Side effects externos dentro de la transacción/request principal sin outbox.
