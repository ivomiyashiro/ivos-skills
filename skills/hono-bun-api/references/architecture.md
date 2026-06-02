# Arquitectura: Modular Monolith + CQRS Lite

## Modelo Mental

Usar un monolito modular con limites de dominio claros:

```txt
HTTP / API
  -> Application
  -> Domain
  -> Infrastructure
  -> Database / Supabase / external services
```

El monolito modular mantiene deploy simple y permite extraer un modulo a servicio
separado si el producto lo justifica. No diseñar microservicios antes de que haya
presion real de escala, ownership o aislamiento operacional.

## Por Qué No Vertical Slice Plano

Un vertical slice plano funciona bien para APIs chicas, pero en dominios que crecen
termina mezclando reglas, SQL, schemas y routing dentro del mismo nivel. La variante
recomendada es **vertical por modulo, layered por dentro**:

```txt
modules/projects/
  projects.routes.ts
  projects.controller.ts
  application/
  domain/
  infrastructure/
```

La navegacion queda clara:
- Endpoint: `*.routes.ts` / `*.controller.ts`
- Caso de uso: `application/handlers`
- Regla de negocio: `domain`
- SQL/adapters: `infrastructure`

## CQRS Lite

Lite significa:
- misma base de datos para reads y writes
- sin event sourcing por default
- sin proyecciones async obligatorias
- separation conceptual entre commands y queries
- writes pasan por dominio/repositorios cuando hay invariantes
- reads pueden usar Drizzle directo y DTOs especificos

No agregar full CQRS salvo que haya una razon fuerte: auditoria inmutable, read load
extremo, proyecciones complejas o equipos con ownership separado.

## Direccion De Dependencias

```txt
modules/<x>/controller      -> application
modules/<x>/application     -> domain + shared abstractions
modules/<x>/domain          -> shared primitives only
modules/<x>/infrastructure  -> domain interfaces + shared db/adapters
shared/                     -> no importa modules
```

Reglas:
- `domain/` no importa Hono, Drizzle, Supabase, Bun ni logger concreto.
- `application/` no importa Hono. Puede depender de interfaces/adapters.
- `infrastructure/` implementa detalles tecnicos.
- Controllers son adapters HTTP y pueden importar Hono/Zod/shared HTTP helpers.
- Un modulo no importa internals de otro modulo.

## Coordinacion Entre Modulos

Preferir:
1. Domain/application events para reaccionar a cambios.
2. Queries read-side con joins SQL cuando solo se necesita leer.
3. Servicios compartidos en `shared/` solo si son genuinamente cross-cutting.
4. API interna/externa si el modulo fue extraido a otro servicio.

Evitar import directo de `modules/A/domain` desde `modules/B`. Eso crea acoplamiento
oculto y hace mas dificil extraer o testear modulos.

## Reglas De Diseno

1. Una carpeta `modules/<name>/` representa un bounded context chico o feature area.
2. Dividir el modulo cuando sus casos de uso no comparten lenguaje ni invariantes.
3. Mantener controllers finos: parse/validacion/contexto/result HTTP.
4. Mantener application handlers como casos de uso ejecutables desde HTTP, jobs o tests.
5. Poner invariantes en entities/policies/value objects, no en controllers.
6. Usar repositorios solo para agregados/write-side.
7. Usar read models/query handlers para listados, dashboards, search y reports.
8. Mantener transacciones explicitas en writes criticas.

## Anti-Patrones

- Controllers con reglas de negocio.
- `UserService` o `ProjectService` con decenas de metodos inconexos.
- Repositorios universales con `findAll`, `search`, `stats`, `dashboard`.
- Dominio importando `drizzle-orm`, `Context` de Hono o SDK de Supabase.
- Application llamando `c.req` o devolviendo `Response`.
- RLS como unica autorizacion backend.
- Offset pagination en tablas grandes.
- Side effects externos dentro de la transaccion/request principal sin outbox.
