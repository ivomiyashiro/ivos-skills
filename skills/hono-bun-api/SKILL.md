---
name: hono-bun-api
description: Construir APIs TypeScript backend reales con Hono + Bun siguiendo modular monolith, CQRS lite, capas application/domain/infrastructure por modulo, Drizzle sobre Postgres/Supabase, Supabase Auth/Storage/RLS como infraestructura, repositorios para agregados de escritura, query handlers optimizados para reads, Zod/OpenAPI y testing con Bun. Usar SIEMPRE que el usuario mencione hono, bun, "crear api typescript", endpoints, rutas, controller, command handler, query handler, repository TS, Drizzle, Supabase, zod-openapi, OpenAPIHono, scaffold de proyecto Bun, modular monolith, backend architecture, o pida estructurar/scaffoldear un proyecto TS server-side. NO usar para .NET, MediatR ni EF Core.
---

# Skill: Hono + Bun API

API opinada en TypeScript con **modular monolith + CQRS lite**. Cada modulo
contiene su HTTP adapter, application layer, domain layer e infrastructure layer.
Hono queda fino, Drizzle habla con Postgres, Supabase se trata como infraestructura
y las lecturas se optimizan sin pasar por agregados cuando no aportan valor.

> **Cómo usar este skill:** este archivo es el overview. Para el detalle profundo,
> cargar solo la referencia relevante en `references/`. Para crear un modulo paso a
> paso, usar `references/feature-walkthrough.md`. Para arrancar de cero, copiar
> `assets/project-skeleton/`.

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
| Testing | **bun:test** + pglite/testcontainers | Unit de dominio/application e integration contra app/DB. |
| Tipos | **TypeScript strict** | Sin `any` estructural ni singletons globales. |

---

## 2. Principios No Negociables

1. **Modular monolith por dominio.** Carpetas principales son `src/modules/<module>/`.
2. **Capas internas claras.** HTTP adapter -> application -> domain -> infrastructure.
3. **CQRS lite.** Commands modifican estado; queries leen DTOs optimizados. Mismo DB, sin event sourcing por default.
4. **Writes protegen invariantes.** Commands pasan por application/domain y repositorios de agregados.
5. **Reads no cargan agregados por ritual.** Query handlers pueden usar Drizzle directo o read models.
6. **Repositorios no son abstracción universal de la DB.** Usarlos para agregados/write-side; dashboards, search y stats son query handlers.
7. **Hono no entra al application/domain.** Controllers adaptan request/response; handlers son ejecutables desde HTTP, jobs, scripts o tests.
8. **Supabase es infraestructura.** Auth, Storage, Realtime y RLS son adapters/capabilities; no definen la arquitectura.
9. **AuthZ vive en application/domain.** RLS es defensa adicional, especialmente con acceso directo desde cliente.
10. **Transacciones explícitas para writes críticas.** Si una operación toca multiples tablas/agregados, envolverla en `TransactionManager`.
11. **Outbox para side effects durables.** Emails, webhooks, notificaciones y sync externos no deben romper el request principal.
12. **Zod en el borde HTTP.** Domain valida invariantes; Zod valida shape y tipos de entrada.

---

## 3. Estructura Canónica

```txt
src/
  app.ts
  server.ts
  container.ts

  shared/
    config/
      env.ts
    auth/
      supabase.ts
    db/
      client.ts
      schema.ts
      transaction.ts
    errors/
      app-error.ts
      to-http.ts
    events/
      domain-event.ts
      event-bus.ts
      outbox.ts
    hono/
      router.ts
      types.ts
    middlewares/
      auth.ts
      error-handler.ts
      logger.ts
      request-id.ts
    observability/
    openapi/
    result.ts

  modules/
    examples/
      examples.routes.ts
      examples.controller.ts
      examples.schemas.ts
      examples.types.ts

      application/
        commands/
          create-example.command.ts
          update-example.command.ts
        queries/
          get-example-by-id.query.ts
          list-examples.query.ts
        handlers/
          create-example.handler.ts
          update-example.handler.ts
          get-example-by-id.handler.ts
          list-examples.handler.ts

      domain/
        example.entity.ts
        example.repository.ts
        example.errors.ts
        example.policies.ts
        example.events.ts

      infrastructure/
        drizzle-example.repository.ts
        example.mapper.ts
        example-read-model.ts

      examples.routes.test.ts

  jobs/
    workers/
```

Para estructura y tradeoffs: `references/architecture.md` y `references/modules.md`.

---

## 4. Flujo De Request

```txt
HTTP / Hono route
  -> controller
  -> application command/query handler
  -> domain entity/policy/repository interface
  -> infrastructure adapter / Drizzle / Supabase / external service
```

Controllers hacen:
- leer input validado por Hono/Zod
- leer `auth`, `logger`, `requestId` del context
- llamar command/query handler
- mapear resultado a HTTP

Controllers no hacen:
- reglas de negocio
- SQL
- transacciones
- llamadas directas a Supabase/Stripe/email

---

## 5. CQRS Lite

**Commands**
- Modifican estado.
- Orquestan authorization, reglas de negocio, transacciones, repositorios y eventos.
- Retornan output mínimo o DTO de confirmación.
- Usan repositorios de agregados cuando hay invariantes que proteger.

**Queries**
- Leen datos.
- Devuelven DTOs diseñados para el endpoint.
- Pueden usar Drizzle directo, joins, CTEs o raw SQL.
- No mutan estado y no usan repositorios de write-side.

Regla práctica:

```txt
Si necesito proteger invariantes de negocio -> domain + repository.
Si necesito leer datos eficiente para UI/API -> query handler + Drizzle/read model.
```

Detalles: `references/commands.md`, `references/queries.md`, `references/repositories.md`.

---

## 6. Repositorios

Crear repositorios para agregados de dominio:
- `UserRepository`
- `OrganizationRepository`
- `ProjectRepository`
- `SubscriptionRepository`
- `InvoiceRepository`

Evitar repositorios para:
- dashboards
- search
- stats
- reports
- listados con filtros/joins complejos

La interfaz vive en `domain/`; la implementación Drizzle vive en `infrastructure/`.

---

## 7. Supabase

Usar Supabase como infraestructura:
- Auth para identidad.
- Postgres como base principal, accedida desde backend con Drizzle.
- Storage cuando haya archivos.
- Realtime si el producto lo necesita.
- RLS como defensa en profundidad, especialmente si el frontend accede directo a Supabase.

No usar el SDK de Supabase por todos lados como capa de aplicación. El backend
principal debe hablar con Postgres vía Drizzle salvo que el caso sea propio de
Supabase Auth/Storage/Realtime.

Leer `references/supabase-infrastructure.md` antes de tocar Auth, RLS o service role.

---

## 8. Bootstrap De Proyecto Nuevo

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

Scaffold de modulo:

```bash
bun run scripts/scaffold-module.ts project
```

El script genera `src/modules/projects/` con capas internas y archivos base.

---

## 9. Dependency Injection

No usar DI container pesado al principio. Usar composition root manual:

```ts
export function createContainer() {
  const db = buildDb(env.DATABASE_URL);
  const tx = createTransactionManager(db);
  const eventBus = createEventBus();

  const exampleRepo = new DrizzleExampleRepository(db);
  const exampleReadModel = new ExampleReadModel(db);

  return {
    db,
    tx,
    eventBus,
    exampleRepo,
    exampleReadModel,
  };
}
```

Controllers reciben el container vía closure o `c.var`, pero handlers deben pedir
solo las dependencias que usan. Ver `references/di.md`.

---

## 10. Errores

Default del skeleton: `Result<T, AppError>` en application handlers para errores
esperados. Domain puede exponer errores tipados o policies que devuelven decisiones;
el handler los mapea a `AppError`.

`throw` queda para bugs, fallas de infraestructura y config inválida. El middleware
global los loguea y devuelve 500 neutro.

Si un proyecto prefiere exceptions tipadas para negocio, hacerlo de forma consistente
en todo el modulo y mantener mapper HTTP central. No mezclar estilos dentro del mismo
bounded context.

---

## 11. Testing

Prioridad:
- unit tests de `domain/` para entities, policies e invariantes
- unit tests de `application/handlers` con repos/adapters fake
- integration tests de repositories/read models contra DB real
- e2e/integration tests de Hono con `app.request()`

No testear solo endpoints. Las reglas valiosas viven en domain/application.

---

## 12. Checklist Pre-PR

- [ ] Input HTTP validado con Zod.
- [ ] Controllers sin reglas de negocio ni SQL.
- [ ] Application handlers no importan Hono.
- [ ] Domain no importa Hono, Drizzle, Supabase ni Bun.
- [ ] Repository interfaces viven en domain; implementations en infrastructure.
- [ ] Commands usan transacción cuando hay multiples writes o outbox.
- [ ] Queries usan Drizzle/read model y devuelven DTO especifico.
- [ ] No hay repositorios para dashboards/search/stats/reports.
- [ ] AuthN en middleware; AuthZ en application/domain.
- [ ] Multi-tenant queries filtran por `organizationId`/`tenantId` cuando aplique.
- [ ] Listados grandes usan cursor pagination.
- [ ] Side effects durables usan outbox/worker.
- [ ] OpenAPI actualizado desde schemas.
- [ ] Logs estructurados con `requestId`, sin tokens completos.
- [ ] `bun run typecheck` y tests relevantes pasan.

---

## 13. Tabla De Referencia Rápida

| Situación | Ir a |
|---|---|
| Arquitectura general | `references/architecture.md` |
| Estructura por modulo | `references/modules.md` |
| Crear un modulo paso a paso | `references/feature-walkthrough.md` |
| Commands | `references/commands.md` |
| Queries/read models | `references/queries.md` |
| Repositories | `references/repositories.md` |
| Domain layer | `references/domain.md` |
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
- Aplicar dominio rico solo donde haya invariantes reales. Para CRUD simple, mantener
  handlers y entities livianos.
- OpenAPI para consumidores externos; Hono RPC cuando frontend y backend TypeScript
  están bajo el mismo control.
