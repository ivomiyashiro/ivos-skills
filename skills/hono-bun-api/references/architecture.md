# Arquitectura: Features Verticales + CQRS Lite

## Modelo Mental

Usar un monolito con features verticales y limites claros:

```txt
HTTP / API
  -> controller
  -> command/query use case
  -> repository/read model/utils
  -> Database / Supabase / external services
```

El deploy sigue siendo simple, pero cada feature concentra lo que cambia junto. No
diseñar microservicios antes de que haya presión real de escala, ownership o
aislamiento operacional.

## Estructura Recomendada

```txt
features/projects/
  controller/
  routes/
  repository/
  utils/
  use-cases/
    commands/
    queries/
  projects.constants.ts
  projects.schemas.ts
  projects.types.ts
  index.ts
```

La navegación queda clara:

- Endpoint: `routes/` + `controller/`
- Caso de uso: `use-cases/commands` o `use-cases/queries`
- Regla local pura: `utils/`
- SQL/adapters/read models: `repository/`

## CQRS Lite

Lite significa:

- misma base de datos para reads y writes
- sin event sourcing por default
- sin proyecciones async obligatorias
- separación conceptual entre commands y queries
- writes pasan por use cases + repository cuando hay invariantes
- reads pueden usar read models/Drizzle directo y DTOs específicos

No agregar full CQRS salvo que haya una razón fuerte: auditoría inmutable, read load
extremo, proyecciones complejas o equipos con ownership separado.

## Dirección De Dependencias

```txt
features/<x>/routes        -> controller + schemas
features/<x>/controller    -> use-cases + shared HTTP helpers
features/<x>/use-cases     -> repository + utils + shared abstractions
features/<x>/repository    -> shared db + utils
features/<x>/utils         -> shared primitives only
shared/                    -> no importa features
```

Reglas:

- `utils/` no importa Hono, Drizzle, Supabase, Bun ni logger concreto.
- `use-cases/` no importa Hono.
- `repository/` implementa detalles técnicos de persistencia.
- Controllers son adapters HTTP y pueden importar Hono/Zod/shared HTTP helpers.
- Una feature no importa internals de otra feature.
- Correr `bun run check:boundaries` para hacer estas reglas verificables.

## Coordinación Entre Features

Preferir:

1. Eventos para reaccionar a cambios.
2. Queries read-side con joins SQL cuando solo se necesita leer.
3. Servicios compartidos en `shared/` solo si son genuinamente cross-cutting.
4. API interna/externa si la feature fue extraída a otro servicio.

Evitar import directo de `features/A/utils` o `features/A/repository` desde
`features/B`. Eso crea acoplamiento oculto y hace más difícil extraer o testear.

## Reglas De Diseño

1. Una carpeta `features/<name>/` representa un bounded context chico o feature area.
2. Dividir la feature cuando sus casos de uso no comparten lenguaje ni invariantes.
3. Mantener controllers finos: parse/validación/contexto/result HTTP.
4. Mantener use cases ejecutables desde HTTP, jobs o tests.
5. Poner invariantes en use cases, policies o entidades livianas; no en controllers.
6. Usar repositories para writes/agregados, no para todo SQL.
7. Usar read models/query use cases para listados, dashboards, search y reports.
8. Mantener transacciones explícitas en writes críticas.

## Anti-Patrones

- Controllers con reglas de negocio.
- `UserService` o `ProjectService` con decenas de métodos inconexos.
- Repositorios universales con `findAll`, `search`, `stats`, `dashboard`.
- Utils importando `drizzle-orm`, `Context` de Hono o SDK de Supabase.
- Use cases llamando `c.req` o devolviendo `Response`.
- RLS como única autorización backend.
- Offset pagination en tablas grandes.
- Side effects externos dentro de la transacción/request principal sin outbox.
