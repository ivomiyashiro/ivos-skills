---
name: hono-bun-api
description: Construir APIs TypeScript backend reales con Hono + Bun siguiendo features verticales, CQRS lite, controller/routes/repository/utils/use-cases, Drizzle sobre Postgres/Supabase, Supabase Auth/Storage/RLS como infraestructura, Zod/OpenAPI y testing con Bun. Usar SIEMPRE que el usuario mencione hono, bun, "crear api typescript", endpoints, rutas, controller, command, query, use case, repository TS, Drizzle, Supabase, zod-openapi, OpenAPIHono, scaffold de proyecto Bun, modular monolith, backend architecture, o pida estructurar/scaffoldear un proyecto TS server-side. NO usar para .NET, MediatR ni EF Core.
---

# Skill: Hono + Bun API

API opinada en TypeScript con **features verticales + CQRS lite**. Cada feature
contiene su HTTP adapter, casos de uso, persistencia y helpers locales. Hono queda
fino, Drizzle habla con Postgres, Supabase se trata como infraestructura y las
lecturas se optimizan sin cargar modelos de escritura cuando no aportan valor.

> **Cómo usar este skill:** este archivo es la guía canónica. Para detalle profundo,
> cargar solo la referencia relevante en `references/`. Para arrancar de cero,
> copiar `assets/project-skeleton/`.

---

## 1. Stack Opinada

| Capa | Paquete | Decisión |
|---|---|---|
| Runtime | **Bun >= 1.1** | Runtime, package manager, test runner y scripts. Mantenerlo en bordes. |
| HTTP | **Hono 4** | Routing, middleware, `app.request()` para integration tests, RPC opcional. |
| Validación | **Zod 3** | Validar input HTTP y derivar tipos/OpenAPI desde una fuente. |
| OpenAPI | **@hono/zod-openapi** + **@scalar/hono-api-reference** | Docs en `/docs`, spec en `/openapi.json`. |
| Auth | **Supabase Auth** + `jose` | JWT verification en middleware; otros IdP entran por `VerifyFn`. |
| DB | **Drizzle ORM + postgres.js** | Acceso tipado a Supabase Postgres o Postgres propio, migraciones versionadas. |
| Logger | **Pino 9** | Logs JSON con `requestId`. |
| Métricas | **prom-client 15** | `/metrics` Prometheus. |
| Testing | **bun:test** + pglite/testcontainers | Unit de utils/use-cases e integration contra app/DB. |
| Tipos | **TypeScript strict** | Sin `any` estructural ni singletons globales. |

---

## 2. Principios

1. **Features verticales.** Carpetas principales son `src/features/<feature>/`.
2. **`shared` es infraestructura compartida.** Config, DB, errores, middleware, auth, observabilidad y tipos realmente globales.
3. **Una feature no importa internals de otra feature.** Si necesita leer datos, usar SQL/read model; si necesita reaccionar, usar eventos.
4. **CQRS lite.** Commands modifican estado; queries leen DTOs optimizados. Mismo DB, sin event sourcing por default.
5. **Controllers son adaptadores HTTP.** Validan/leen input, toman `auth/logger/requestId`, llaman un use case y mapean respuesta.
6. **Use cases no importan Hono.** Deben poder ejecutarse desde HTTP, jobs, scripts o tests.
7. **Repositories no son abstracción universal de DB.** Usarlos para writes/agregados y read models locales; dashboards/search/stats pueden consultar con Drizzle directo desde queries.
8. **Utils no es cajón desastre.** Solo helpers puros locales de la feature: policies, mappers puros, entidades livianas, formatters, guards.
9. **Supabase es infraestructura.** Auth, Storage, Realtime y RLS son adapters/capabilities; no definen la arquitectura.
10. **Zod en el borde HTTP.** Zod valida shape de entrada; los use cases/utils validan reglas de negocio.
11. **Transacciones explícitas para writes críticas.** Si una operación toca múltiples tablas o publica side effects durables, envolverla en `TransactionManager`.
12. **Outbox para side effects durables.** Emails, webhooks, notificaciones y sync externos no deben romper el request principal.
13. **Performance es parte del endpoint.** Cada query debe tener DTO proyectado, límite, paginación estable e índice compatible.
14. **Boundaries verificables.** Usar `bun run check:boundaries` para evitar imports internos entre features.

---

## 3. Estructura Canónica

```txt
src/
  app.ts
  server.ts
  container.ts

  shared/
    auth/
    config/
    db/
    errors/
    events/
    hono/
    middlewares/
    observability/
    openapi/
    types/
    utils/
    result.ts

  features/
    examples/
      controller/
        examples.controller.ts
      routes/
        examples.routes.ts
        examples.routes.test.ts
      repository/
        example.repository.ts
        drizzle-example.repository.ts
        example-read-model.ts
        example.mapper.ts
      utils/
        example.entity.ts
        example.policies.ts
        example.events.ts
      use-cases/
        commands/
          create-example.command.ts
          update-example.command.ts
        queries/
          get-example-by-id.query.ts
          list-examples.query.ts
      examples.constants.ts
      examples.schemas.ts
      examples.types.ts
      index.ts

  jobs/
    workers/
```

`features/<feature>/index.ts` debe exportar solo la API pública de la feature,
por ejemplo `buildExamplesRoutes` y tipos que otros bordes realmente necesiten.

---

## 4. Reglas De Ubicación

**Schemas**

- Co-localizar schemas HTTP en `<feature>.schemas.ts`.
- Inferir DTO/input/query types con `z.infer`.
- No duplicar un tipo manual si puede salir del schema.

**Types**

- Usar `<feature>.types.ts` para tipos propios de la feature que no son schemas HTTP.
- Usar `shared/types/` solo para contratos globales: `Pagination`, `ApiResponse`, `AuthUser`, `RequestContext`.
- Evitar `types.ts` gigantes. Si mezcla conceptos, dividir por responsabilidad.

**Constants**

- Usar `<feature>.constants.ts` para constantes de negocio/locales: estados, defaults, límites.
- Usar `shared/config/env.ts` para env/config parseada.
- Evitar `shared/constants.ts`; suele convertirse en acoplamiento silencioso.

**Utils**

- Usar `utils/` solo para código puro local: policies, entidades livianas, guards, mappers sin DB, helpers de formato.
- Si un helper se comparte entre dos features, copiarlo primero si es chico; mover a `shared/utils` recién cuando sea una abstracción real.
- No poner SQL, Hono context, clients externos ni side effects en `utils/`.

**Repository**

- `repository/` contiene persistencia de la feature: interface de write repository, implementación Drizzle, mapper y read model.
- Para writes con invariantes, usar repository + transaction.
- Para reads optimizadas, usar query use case + read model/Drizzle.

---

## 5. Un Archivo Una Función

Regla default:

```txt
use-cases/commands/create-example.command.ts -> exporta createExampleCommand()
use-cases/queries/list-examples.query.ts     -> exporta listExamplesQuery()
```

Cada archivo de command/query contiene:

- input type del caso de uso
- deps type del caso de uso
- una función principal exportada
- helpers privados chicos si son exclusivos de ese caso

No separar `handler` de `command/query` por ritual. Si el archivo crece demasiado,
extraer helpers privados a `utils/` o repos/read models a `repository/`.

Para `controller/`, empezar con un archivo por feature (`examples.controller.ts`)
con varios handlers HTTP. Dividir en `create-example.controller.ts` solo cuando el
archivo sea difícil de navegar o tenga dependencias muy distintas.

Para `utils/`, agrupar por tema (`date.utils.ts`, `example.policies.ts`,
`example.entity.ts`). No crear un archivo por función salvo que sea una función
central, compleja o con tests propios.

---

## 6. Flujo De Request

```txt
HTTP / Hono route
  -> controller
  -> command/query use case
  -> repository/read model/utils
  -> Drizzle / Supabase / external adapter
```

Controllers hacen:

- leer input validado por Hono/Zod
- leer `auth`, `logger`, `requestId` del context
- llamar command/query
- mapear `Result` a HTTP

Controllers no hacen:

- reglas de negocio
- SQL
- transacciones
- llamadas directas a Supabase/Stripe/email

---

## 7. CQRS Lite

**Commands**

- Modifican estado.
- Orquestan authorization, reglas de negocio, transacciones, repositorios y eventos.
- Retornan output mínimo o DTO de confirmación.
- Usan repositories cuando hay invariantes que proteger.

**Queries**

- Leen datos.
- Devuelven DTOs diseñados para el endpoint.
- Pueden usar read models, Drizzle directo, joins, CTEs o raw SQL.
- No mutan estado y no usan repositories de write-side salvo que el caso sea trivial.

Regla práctica:

```txt
Si necesito proteger invariantes de negocio -> command + utils/entity/policy + repository.
Si necesito leer datos eficiente para UI/API -> query + read model/Drizzle.
```

---

## 8. Performance Y Boundaries

Antes de cerrar un endpoint:

- proyectar DTOs explícitos; no usar `select *`
- evitar N+1 con joins, batch queries o read models
- usar cursor pagination en listados grandes
- definir `limit` máximo y response payload chico
- filtrar tenant/organization en SQL, no en memoria
- diseñar el índice junto con la query
- correr boundary checks para imports entre features

Para cada listado, documentar mentalmente:

```txt
GET /projects?status=active
where organization_id = ?
  and status = ?
order by created_at desc, id desc

index:
(organization_id, status, created_at desc, id desc)
```

Si una feature necesita otra, importar solo su API pública desde
`@features/<feature>`. No importar `@features/<feature>/repository`,
`@features/<feature>/utils` ni subpaths internos.

Detalles: `references/performance.md` y `references/pagination-and-indexes.md`.

---

## 9. Bootstrap De Proyecto Nuevo

```bash
cp -r <skill-dir>/assets/project-skeleton/ ./mi-api
cd mi-api
bun install
cp .env.example .env
bun run db:migrate
bun run dev
# server  -> http://localhost:3000
# docs    -> http://localhost:3000/docs
# metrics -> http://localhost:3000/metrics
```

Scaffold de feature:

```bash
bun run scripts/scaffold-feature.ts project
# o
bun run scaffold project
```

El script genera `src/features/projects/` con controller, routes, repository,
utils, use cases, schemas, constants, types e index público.

---

## 10. Dependency Injection

No usar DI container pesado al principio. En esta skill, "DI" significa pasar deps
desde afuera, no usar decorators ni `container.resolve()`.

Regla práctica:

```txt
Función pura -> no DI.
Use case con IO -> deps explícitas.
Deps repetidas en varios controllers -> factory por feature.
DI container library -> solo si hay lifetimes/grafo complejo real.
```

Usar composition root manual para crear recursos de app:

```ts
export function createContainer() {
  const db = buildDb(env.DATABASE_URL);
  const tx = createTransactionManager(db);
  const eventBus = createEventBus();

  const exampleReadModel = new ExampleReadModel(db);

  return {
    db,
    tx,
    eventBus,
    exampleReadModel,
    createExampleRepository: (txDb: Db) => new DrizzleExampleRepository(txDb),
  };
}
```

Los use cases reciben solo las deps que usan, no el container entero. Si varios
controllers repiten las mismas deps, crear una factory local:

```ts
export const createExampleUseCases = (deps: ExampleUseCasesDeps) => ({
  create: (command: CreateExampleCommand) => createExampleCommand(deps, command),
  update: (command: UpdateExampleCommand) => updateExampleCommand(deps, command),
  list: (query: ListExamplesQuery) => listExamplesQuery({ readModel: deps.readModel }, query),
});
```

Controllers reciben el container por closure, agregan deps request-scoped como
`logger/auth`, crean la factory y llaman métodos del caso de uso. Ver `references/di.md`.

---

## 11. Errores

Default del skeleton: `Result<T, AppError>` en use cases para errores esperados.
Utils/policies pueden exponer errores tipados o decisiones; el use case los mapea a
`AppError`.

`throw` queda para bugs, fallas de infraestructura y config inválida. El middleware
global los loguea y devuelve 500 neutro.

Si un proyecto prefiere exceptions tipadas para negocio, hacerlo de forma
consistente en toda la feature y mantener mapper HTTP central. No mezclar estilos.

---

## 12. Testing

Prioridad:

- unit tests de `utils/` para policies, entidades e invariantes
- unit tests de `use-cases/` con repos/adapters fake
- integration tests de repositories/read models contra DB real
- HTTP integration tests de Hono con `app.request()`

No testear solo endpoints. Las reglas valiosas viven en use cases y utils.

---

## 13. Checklist Pre-PR

- [ ] Input HTTP validado con Zod.
- [ ] Controllers sin reglas de negocio ni SQL.
- [ ] Use cases no importan Hono.
- [ ] Utils no importan Hono, Drizzle, Supabase ni Bun.
- [ ] Constants/types/schemas viven en la feature salvo que sean globales reales.
- [ ] Commands usan transacción cuando hay múltiples writes o outbox.
- [ ] Queries usan read models/Drizzle y devuelven DTO específico.
- [ ] Queries/listados tienen DTO proyectado, límite máximo e índice compatible.
- [ ] No hay N+1 obvio ni filtrado tenant/organization en memoria.
- [ ] `bun run check:boundaries` pasa.
- [ ] No hay repositorios para dashboards/search/stats/reports por costumbre.
- [ ] AuthN en middleware; AuthZ en use cases/utils.
- [ ] Multi-tenant queries filtran por `organizationId`/`tenantId` cuando aplique.
- [ ] Listados grandes usan cursor pagination.
- [ ] Side effects durables usan outbox/worker.
- [ ] OpenAPI actualizado desde schemas.
- [ ] Logs estructurados con `requestId`, sin tokens completos.
- [ ] `bun run typecheck` y tests relevantes pasan.

---

## 14. Tabla De Referencia Rápida

| Situación | Ir a |
|---|---|
| Arquitectura general | `references/architecture.md` |
| Estructura por feature | `references/features.md` |
| Crear una feature paso a paso | `references/feature-walkthrough.md` |
| Commands | `references/commands.md` |
| Queries/read models | `references/queries.md` |
| Performance por endpoint | `references/performance.md` |
| Repositories | `references/repositories.md` |
| Transacciones | `references/transactions.md` |
| Outbox | `references/outbox.md` |
| Supabase | `references/supabase-infrastructure.md` |
| Multi-tenancy | `references/multi-tenancy.md` |
| Paginación e índices | `references/pagination-and-indexes.md` |
| DI sin container | `references/di.md` |
| Errores/Result | `references/errors.md` |
| OpenAPI | `references/openapi.md` |
| Testing | `references/testing.md` |
| Auth | `references/auth.md` |

---

## Notas Finales

- Docs en español; identificadores, APIs públicas y mensajes técnicos en inglés.
- Bun debe quedar en bordes: boot, server, scripts, tests y workers.
- Preferir Drizzle como default. Kysely o Bun.sql son opciones si el repo ya lo pide.
- Aplicar entidades/policies solo donde haya invariantes reales. Para CRUD simple,
  mantener use cases livianos.
- OpenAPI para consumidores externos; Hono RPC cuando frontend y backend TypeScript
  están bajo el mismo control.
