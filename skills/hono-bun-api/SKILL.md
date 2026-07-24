---
name: hono-bun-api
description: Use when creating or structuring TypeScript APIs with Hono and Bun, REST endpoints, commands/queries, Drizzle, Postgres, Supabase Auth, Zod, OpenAPI, explicit DI, CQRS lite, HTTP tests, or backend scaffolds. Excludes .NET, MediatR, and EF Core.
---

# Skill: Hono + Bun API

API opinada en TypeScript con **features verticales planas + CQRS lite**. Cada
feature contiene un único adapter HTTP, sus operaciones y sus contratos locales.
Hono queda fino, Drizzle habla directamente con Postgres por default, Supabase se
trata como infraestructura y las lecturas se optimizan sin cargar modelos de
escritura cuando no aportan valor.

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
| Testing | **bun:test** + Docker Compose Postgres | Tests puros co-localizados e integration HTTP/DB contra Postgres real. |
| Tipos | **TypeScript strict** | Sin `any` estructural ni singletons globales. |

---

## 2. Principios

1. **Features verticales.** Carpetas principales son `src/features/<feature>/`.
2. **`shared` es infraestructura compartida.** Config, DB, errores, middleware, auth, observabilidad y tipos realmente globales.
3. **Una feature no importa internals de otra feature.** Si necesita leer datos, usar una query SQL/Drizzle propia; si necesita reaccionar, usar eventos.
4. **CQRS lite.** Commands modifican estado; queries leen DTOs optimizados. Mismo DB, sin event sourcing por default.
5. **`<feature>.routes.ts` es el adapter HTTP.** Valida/lee input, toma `auth/logger/requestId`, llama una operación y mapea la respuesta; no contiene reglas ni SQL.
6. **Commands y queries no importan Hono.** Deben poder ejecutarse desde HTTP, jobs, scripts o tests, con deps explícitas por operación.
7. **Drizzle directo es el default.** Extraer un helper local o repository solo ante complejidad concreta o reutilización comprobada; nunca por ritual.
8. **El mapping pertenece a la operación dueña.** No crear una capa o carpeta de mappers por default.
9. **Supabase es infraestructura.** Auth, Storage, Realtime y RLS son adapters/capabilities; no definen la arquitectura.
10. **Zod en el borde HTTP.** Zod valida shape de entrada; commands, queries y helpers locales validan reglas de negocio.
11. **Transacciones explícitas para writes críticas.** Si una operación toca múltiples tablas o publica side effects durables, envolverla en `TransactionManager`.
12. **Outbox para side effects durables.** Emails, webhooks, notificaciones y sync externos no deben romper el request principal.
13. **Performance es parte del endpoint.** Cada query debe tener DTO proyectado, límite, paginación estable e índice compatible.
14. **Boundaries verificables.** Usar `bun run check:boundaries` para evitar imports internos entre features.
15. **Commands retryables deben ser idempotentes.** Pagos, webhooks, invitaciones y creates sensibles necesitan `Idempotency-Key` o clave natural.
16. **Endpoints caros tienen límites.** Usar rate limit, límites de concurrencia o colas cuando el costo no sea trivial.
17. **Ninguna llamada externa sin timeout.** Retries solo si la operación es idempotente o está protegida por idempotencia.
18. **Cache con invalidación definida.** No agregar Redis por reflejo; primero medir y decidir cómo se invalida.
19. **Observabilidad mínima por operación.** Logs estructurados, métricas útiles, requestId y sin PII/tokens completos.

---

## 3. Estructura Canónica

```txt
src/
  app.ts
  server.ts
  di-container.ts

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
        use-cases/
          commands/
            create-example.command.ts
            update-example.command.ts
          queries/
            get-example-by-id.query.ts
            list-examples.query.ts
       __tests__/
         examples.integration.ts
       examples.constants.ts
       examples.errors.ts
       examples.events.ts
       examples.routes.ts
       examples.schemas.ts
       examples.types.ts
       index.ts

  jobs/
    workers/
```

La raíz de una feature contiene `<feature>.routes.ts`, `<feature>.constants.ts`,
`<feature>.events.ts`, schemas, types, errors, `use-cases/commands/`, `use-cases/queries/` y
`__tests__/`. Puede incluir `index.ts` para exportar solo su API pública, por
ejemplo `buildExamplesRoutes` y tipos que otros bordes realmente necesiten. No
prescribir `controller/`, `routes/`, `repository/` ni `utils/`.

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

**Helpers y repositories (excepciones)**

- Mantener helpers privados en el archivo de la operación mientras sean exclusivos de ella.
- Extraer un helper local solo si reduce complejidad concreta o se reutiliza dentro de la feature. Debe conservar límites claros: sin Hono, IO oculto ni estado global.
- Extraer un repository solo si un command tiene una frontera de persistencia compleja, invariantes de agregado o lógica de acceso reutilizada. `references/repositories.md` documenta esta excepción, no una estructura default.
- Los mappers viven en el command/query que posee el DTO. Extraerlos solo con la misma evidencia de complejidad o reutilización.

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

No separar handler, mapper, helper o repository por ritual. Si el archivo crece,
extraer primero un helper privado; promoverlo a archivo local solo ante complejidad
concreta o reutilización. Un query que un command necesita sigue en `use-cases/queries/` y se
importa desde allí; no duplicar ni mover reads a commands.

---

## 6. Flujo De Request

```txt
HTTP / Hono route
  -> <feature>.routes.ts
  -> command/query
  -> Drizzle / Supabase / external adapter
```

`<feature>.routes.ts` hace:

- leer input validado por Hono/Zod
- leer `auth`, `logger`, `requestId` del context
- llamar command/query
- mapear `Result` a HTTP

`<feature>.routes.ts` no hace:

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
- Usan Drizzle directo por default; extraen un repository solo con complejidad o reutilización concreta.

**Queries**

- Leen datos.
- Devuelven DTOs diseñados para el endpoint.
- Usan Drizzle directo, joins, CTEs o raw SQL según la consulta.
- No mutan estado. Si un command necesita un read reutilizable, lo importa desde `use-cases/queries/`.

Regla práctica:

```txt
Si necesito modificar estado -> command + deps explícitas + Drizzle/tx.
Si necesito leer datos eficiente para UI/API -> query + Drizzle directo.
Si necesito extraer un helper/repository -> demostrar complejidad o reutilización concreta.
```

---

## 8. Performance Y Boundaries

Antes de cerrar un endpoint:

- proyectar DTOs explícitos; no usar `select *`
- evitar N+1 con joins, batch queries o proyecciones directas
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
`@features/<feature>`. No importar subpaths internos de otra feature.

Detalles: `references/performance.md` y `references/pagination-and-indexes.md`.

---

## 9. Operación Y Confiabilidad

**Idempotencia**

- Exigir `Idempotency-Key` en commands sensibles: pagos, webhooks, invitaciones, creates importantes.
- Guardar key + actor/tenant + hash del payload + resultado o referencia creada.
- Si llega la misma key con payload distinto, devolver `Conflict`.

**Rate limit y backpressure**

- Endpoints públicos, login, webhooks y queries caras deben tener rate limit.
- Workers/jobs deben tener concurrencia máxima y backoff.
- En multi-instancia, usar Redis/Postgres/adaptador compartido; el limiter in-memory del skeleton es solo para una instancia o desarrollo.

**Timeouts y retries**

- Toda llamada externa debe tener timeout.
- Retry con backoff solo cuando la operación sea idempotente.
- Propagar `AbortSignal` cuando el cliente/librería lo soporte.

**Cache**

- Cachear solo reads caras y estables.
- Definir invalidación antes de implementar.
- Preferir per-request memoization o HTTP cache antes de Redis si alcanza.

**Observabilidad**

- Loguear duración, status, requestId, actor/tenant cuando aplique.
- Métricas de endpoints, jobs, outbox, retries y rate limits.
- No usar labels de alta cardinalidad como `userId`.

Detalles: `references/idempotency.md`, `references/rate-limits-and-backpressure.md`,
`references/timeouts-and-retries.md`, `references/caching.md`,
`references/observability.md` y `references/outbox.md`.

---

## 10. Bootstrap De Proyecto Nuevo

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

El script genera `src/features/projects/` plano con routes, commands, queries,
tests, schemas, constants, types, errors, events e index público.

---

## 11. Dependency Injection

No usar DI container pesado al principio. En esta skill, "DI" significa pasar deps
desde afuera, no usar decorators ni `container.resolve()`.

Regla práctica:

```txt
Función pura -> no DI.
Use case con IO -> deps explícitas.
Deps repetidas entre operaciones -> pasar solo el subconjunto necesario a cada una.
DI container library -> solo si hay lifetimes/grafo complejo real.
```

Usar composition root manual para crear recursos de app:

```ts
export function createContainer() {
  const db = buildDb(env.DATABASE_URL);
  const tx = createTransactionManager(db);
  const eventBus = createEventBus();

  return {
    db,
    tx,
    eventBus,
  };
}
```

El composition root solo existe en el borde de la aplicación. `buildApp` recibe
las dependencias globales y pasa a cada feature un objeto literal con los valores
que usa. Una feature no importa el tipo del root ni usa `Pick<AppDependencies, ...>`:

```ts
type ExampleRoutesDeps = {
  db: Db;
  tx: TransactionManager;
  eventBus: EventBus;
};

export const buildExampleRoutes = (deps: ExampleRoutesDeps) => {
  // register thin route handlers that call operations with explicit deps
};

export const buildApp = (dependencies: AppDependencies) => {
  app.route(
    "/examples",
    buildExampleRoutes({
      db: dependencies.db,
      tx: dependencies.tx,
      eventBus: dependencies.eventBus,
    }),
  );
};
```

Las routes reciben un tipo local y agregan valores request-scoped como `logger` o
`auth`. Cada operación recibe solo las deps que usa:

```ts
await createExampleCommand({ tx: deps.tx, eventBus: deps.eventBus }, command);
await listExamplesQuery({ db: deps.db }, query);
```

Ver `references/di.md`.

---

## 12. Errores

Default del skeleton: `Result<T, AppError>` en commands y queries para errores esperados.
Los helpers locales puros pueden exponer errores tipados o decisiones; la operación los mapea a
`AppError`.

`throw` queda para bugs, fallas de infraestructura y config inválida. El middleware
global los loguea y devuelve 500 neutro.

Si un proyecto prefiere exceptions tipadas para negocio, hacerlo de forma
consistente en toda la feature y mantener mapper HTTP central. No mezclar estilos.

---

## 13. Testing

Prioridad:

- unit tests solo para lógica pura, co-localizados junto a la operación o contrato que la posee
- HTTP y DB integration tests en `features/<feature>/__tests__/`
- integration con `app.request()` y Postgres real iniciado por Docker Compose
- preload de variables de test, migraciones reales y seed/preparación antes de los tests

No usar mocks de database ni Supabase en tests HTTP/DB. Los commands y queries con
IO se validan mediante integration; las reglas puras se testean unitariamente.

---

## 14. Checklist Pre-PR

- [ ] Input HTTP validado con Zod.
- [ ] `<feature>.routes.ts` es el único adapter HTTP y no contiene reglas de negocio ni SQL.
- [ ] Ninguna feature importa el tipo ni recibe el objeto del composition root.
- [ ] Commands y queries no importan Hono.
- [ ] Constants/types/schemas viven en la feature salvo que sean globales reales.
- [ ] Cada command/query recibe solo deps explícitas y usa Drizzle directo por default.
- [ ] Cada command/query exporta `<verb><Noun>Command|Query`; los reads reutilizados permanecen en `use-cases/queries/`.
- [ ] Mapping vive en la operación dueña; helpers/repositories solo existen por complejidad o reutilización concreta.
- [ ] Commands usan transacción cuando hay múltiples writes o outbox.
- [ ] Commands sensibles tienen idempotencia.
- [ ] Queries usan Drizzle y devuelven DTO específico.
- [ ] Queries/listados tienen DTO proyectado, límite máximo e índice compatible.
- [ ] No hay N+1 obvio ni filtrado tenant/organization en memoria.
- [ ] `bun run check:boundaries` pasa.
- [ ] No hay helpers o repositories extraídos por costumbre.
- [ ] AuthN en middleware; AuthZ en commands/queries o helpers locales.
- [ ] Multi-tenant queries filtran por `organizationId`/`tenantId` cuando aplique.
- [ ] Listados grandes usan cursor pagination.
- [ ] Side effects durables usan outbox/worker.
- [ ] Llamadas externas tienen timeout; retries solo si son idempotentes.
- [ ] Endpoints públicos/caros tienen rate limit o backpressure.
- [ ] Cache, si existe, tiene invalidación definida.
- [ ] Métricas y logs cubren endpoints críticos, jobs, retries y outbox.
- [ ] OpenAPI actualizado desde schemas.
- [ ] Logs estructurados con `requestId`, sin tokens completos.
- [ ] Tests puros están co-localizados y tests HTTP/DB viven en `feature/__tests__/`.
- [ ] Tests HTTP/DB usan `app.request()`, Docker Compose Postgres, preload, migraciones y seed sin mocks de DB/Supabase.
- [ ] `bun run typecheck` y tests relevantes pasan.

---

## 15. Tabla De Referencia Rápida

| Situación | Ir a |
|---|---|
| Arquitectura general | `references/architecture.md` |
| Estructura por feature | `references/features.md` |
| Crear una feature paso a paso | `references/feature-walkthrough.md` |
| Commands | `references/commands.md` |
| Queries y Drizzle directo | `references/queries.md` |
| Performance por endpoint | `references/performance.md` |
| Idempotencia | `references/idempotency.md` |
| Rate limits/backpressure | `references/rate-limits-and-backpressure.md` |
| Timeouts/retries | `references/timeouts-and-retries.md` |
| Cache | `references/caching.md` |
| Repositories (solo excepción) | `references/repositories.md` |
| Transacciones | `references/transactions.md` |
| Outbox | `references/outbox.md` |
| Supabase | `references/supabase-infrastructure.md` |
| Multi-tenancy | `references/multi-tenancy.md` |
| Paginación e índices | `references/pagination-and-indexes.md` |
| DI sin container | `references/di.md` |
| Uso de shared | `references/shared.md` |
| Errores/Result | `references/errors.md` |
| OpenAPI | `references/openapi.md` |
| Testing | `references/testing.md` |
| Auth | `references/auth.md` |

---

## Notas Finales

- Docs en español; identificadores, APIs públicas y mensajes técnicos en inglés.
- Bun debe quedar en bordes: boot, server, scripts, tests y workers.
- Preferir Drizzle como default. Kysely o Bun.sql son opciones si el repo ya lo pide.
- Aplicar entidades o helpers locales solo donde haya invariantes reales. Para CRUD simple,
  mantener commands y queries livianos.
- OpenAPI para consumidores externos; Hono RPC cuando frontend y backend TypeScript
  están bajo el mismo control.
