---
name: hono-bun-api
description: Construir APIs TypeScript opinadas con Hono + Bun siguiendo vertical slice, CQRS lite, Result pattern, Zod, repositorios para escritura y read context para queries. Usar SIEMPRE que el usuario mencione hono, bun, "crear api typescript", endpoints, rutas, route handler, feature slice, command handler, query handler, repository TS, Drizzle, Kysely, zod-openapi, scaffold de proyecto Bun, OpenAPIHono, o pida estructurar/scaffoldear un proyecto TS server-side — incluso si no nombra Hono o Bun explícitamente. NO usar para .NET, MediatR ni EF Core (eso lo cubren cqrs-commands/cqrs-queries/response-pattern).
---

# Skill: Hono + Bun API

API opinada en TypeScript con **vertical slice + CQRS lite**, todo funciones, Result pattern, Zod en el borde, repositorios solo para escritura y read context para queries.

---

## 1. Cuándo usar (triggers)

**Sí, activar cuando:**
- Pide crear una API TypeScript, endpoint, ruta, command/query handler.
- Menciona Hono, Bun, Drizzle, Kysely, Zod, OpenAPIHono, zod-openapi, scaffold de proyecto.
- Pregunta cómo estructurar un feature, repositorio, validación, observabilidad o testing en TS server-side.
- Habla de RPC tipado (`hc<typeof app>`), tests de integración con `app.request()`, graceful shutdown en Bun.

**No activar cuando:**
- Es .NET / MediatR / EF Core (usar `cqrs-commands`, `cqrs-queries`, `response-pattern`, `entity-framework`).
- Es frontend puro (React, Flutter) — aunque la integración FE↔BE sí está cubierta en `references/rpc-client.md`.

---

## 2. Stack opinado

| Capa | Paquete | Por qué |
|---|---|---|
| Runtime | **Bun ≥ 1.1** | Único runtime soportado; HTTP nativo, test runner, dotenv built-in. |
| Framework HTTP | **Hono 4** | Mínimo, type-safe, edge-ready, RPC inference. |
| Validación | **Zod 3** | Mismo Zod genera OpenAPI; tipo inferido sin duplicación. |
| OpenAPI | **@hono/zod-openapi** + **@scalar/hono-api-reference** | Spec derivada del Zod; Scalar UI en `/docs`. |
| Logger | **Pino 9** | Estructurado JSON, child loggers por request. |
| Métricas | **prom-client 15** | `/metrics` Prometheus, sin magia. |
| DB (default del ejemplo) | **Drizzle ORM + postgres.js** | Typed, sin codegen, escape hatch a `sql` raw. Ver `references/database.md` para alternativas (Kysely, Bun.sql). |
| Testing | **bun:test** | Built-in, sin config; `app.request()` para integration sin port. |
| Tipos | **TypeScript 5 strict** | `strict: true`, `noUnusedLocals`, paths `@features/*`, `@shared/*`. |

---

## 3. Principios no negociables

1. **Vertical slice.** Carpetas son features (`src/features/quotes/`), no capas horizontales (`controllers/`, `services/`, `repositories/`).
2. **Funciones + closures, sin clases.** Handlers, repositorios, servicios — todo función pura async. DI por factory que cierra sobre dependencias.
3. **Result pattern, no `throw` para errores de negocio.** `throw` solo se usa para errores de programador (bugs); los atrapa `app.onError`.
4. **Zod en todo borde HTTP.** Ningún handler toca `c.req.json()` directo; validar `json`/`query`/`param` con Zod y usar `c.req.valid('json')`.
5. **Repositorios solo para escritura.** Métodos permitidos: `save`, `findById` (carga del agregado), `delete`. Las queries de listado/proyección NO viven en el repo.
6. **Queries usan `ReadContext` directo.** `ctx.db` es la conexión; query handlers proyectan a DTO sin pasar por agregado.
7. **OpenAPI nace del mismo Zod que valida.** Una sola fuente de verdad. No mantener spec separada.

---

## 4. Estructura canónica del proyecto

```
src/
  server.ts                  # Bun.serve + signals (SIGTERM/SIGINT)
  app.ts                     # OpenAPIHono + middlewares globales + mount features
  shared/
    config/env.ts            # Zod-validated env, fail fast al boot
    hono/types.ts            # AppEnv, AppVars (typing de c.var)
    result.ts                # Result<T,E> + success() + failure()
    errors/
      app-error.ts           # AppError tagged union
      to-http.ts             # Mapper Result → c.json
    middlewares/
      request-id.ts          # genera/propaga X-Request-Id
      logger.ts              # Pino child por request
      error-handler.ts       # app.onError global
      auth.ts                # Slot extensible: authMiddleware(verify), requireAuth
    observability/
      logger.ts              # Pino base + factory de child
      metrics.ts             # prom-client registry + /metrics
    events/event-bus.ts      # In-process EventEmitter wrapper
    db/
      client.ts              # drizzle + postgres.js
      schema.ts              # Drizzle tables (cross-feature)
      transaction.ts         # withTransaction helper
    openapi/docs.ts          # Scalar UI mount + /openapi.json
  features/
    <feature>/
      commands/<action>.ts   # schema + handler + route register
      queries/<query>.ts     # schema + handler + route register
      repository.ts          # factory write-only
      read-context.ts        # tipado del read context del feature
      schemas.ts             # Zod schemas + DTOs registrados en OpenAPI
      events.ts              # tipos de domain events
      routes.ts              # buildXRoutes(deps) → OpenAPIHono
      routes.test.ts         # integration con app.request()
```

---

## 5. Anatomía de un feature slice

Cada feature es una carpeta autocontenida. Sus dependencias **siempre** apuntan a `shared/`; nunca a otro feature.

```
features/quotes/
  commands/
    create-quote.ts          # POST /quotes
    update-quote.ts          # PUT /quotes/:id
  queries/
    get-quote-by-id.ts       # GET /quotes/:id
    list-quotes.ts           # GET /quotes
  repository.ts              # createQuotesRepo(db)
  read-context.ts            # QuotesReadContext + buildQuotesReadContext(c)
  schemas.ts                 # CreateQuoteInput, QuoteDto, etc.
  events.ts                  # QuoteCreated, QuoteUpdated
  routes.ts                  # buildQuotesRoutes(deps)
  routes.test.ts             # tests de integración
```

Cross-feature: **prohibido importarse directo**. Si quotes necesita datos de customers, lo hace vía:
- Domain event suscripto por quotes y emitido por customers, o
- Un join en read-side (queries de quotes pueden joinear tablas de customers; eso vive en `read-context.md`).

---

## 6. Flujo: crear un feature nuevo (6 pasos)

### Paso 1 — Schemas Zod (→ [validation](references/validation.md))

Definir input/output del feature en `schemas.ts`:

```ts
import { z } from '@hono/zod-openapi';

export const QuoteDto = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  total: z.number(),
  status: z.enum(['draft', 'sent', 'accepted']),
}).openapi('QuoteDto');

export const CreateQuoteInput = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    sku: z.string(),
    qty: z.number().int().positive(),
  })).min(1),
}).openapi('CreateQuoteInput');

export type CreateQuoteInput = z.infer<typeof CreateQuoteInput>;
```

### Paso 2 — Repository write-only (→ [repositories](references/repositories.md))

```ts
// features/quotes/repository.ts
import type { Db } from '@shared/db/client';
import { quotes } from '@shared/db/schema';
import { eq } from 'drizzle-orm';

export type QuotesRepo = ReturnType<typeof createQuotesRepo>;

export const createQuotesRepo = (db: Db) => ({
  findById: async (id: string) =>
    db.select().from(quotes).where(eq(quotes.id, id)).then(r => r[0] ?? null),
  save: async (q: typeof quotes.$inferInsert) => {
    await db.insert(quotes).values(q).onConflictDoUpdate({
      target: quotes.id, set: q,
    });
  },
  delete: async (id: string) => {
    await db.delete(quotes).where(eq(quotes.id, id));
  },
});
```

### Paso 3 — Command / Query handler con Result (→ [commands](references/commands.md), [queries](references/queries.md))

```ts
// Command
import { success, failure, type Result } from '@shared/result';
import type { AppError } from '@shared/errors/app-error';

export type CreateQuoteDeps = {
  repo: QuotesRepo;
  eventBus: EventBus;
  logger: Logger;
  clock: Clock;
  userId: string;
};

export const createQuoteHandler = async (
  deps: CreateQuoteDeps,
  input: CreateQuoteInput,
): Promise<Result<QuoteDto, AppError>> => {
  const id = crypto.randomUUID();
  const quote = { id, customerId: input.customerId, total: 0, status: 'draft' as const };
  await deps.repo.save(quote);
  deps.eventBus.publish({ type: 'QuoteCreated', payload: { id }, occurredAt: deps.clock.now() });
  return success(quote);
};
```

```ts
// Query
import type { ReadContext } from '@shared/hono/types';

export const getQuoteByIdHandler = async (
  ctx: ReadContext,
  { id }: { id: string },
): Promise<Result<QuoteDto, AppError>> => {
  const row = await ctx.db.select().from(quotes).where(eq(quotes.id, id)).then(r => r[0]);
  if (!row) return failure({ kind: 'NotFound', resource: 'Quote', id });
  return success(row);
};
```

### Paso 4 — Read context (→ [read-context](references/read-context.md))

```ts
// features/quotes/read-context.ts
import type { Context } from 'hono';
import type { AppEnv } from '@shared/hono/types';

export type QuotesReadContext = ReadContext; // generalmente solo re-export
export const buildQuotesReadContext = (c: Context<AppEnv>): QuotesReadContext => ({
  db: c.get('db'),
  logger: c.get('logger'),
  auth: c.get('auth'),
});
```

### Paso 5 — Routes con OpenAPI + Result → HTTP (→ [routing](references/routing.md), [openapi](references/openapi.md), [errors](references/errors.md))

```ts
// features/quotes/routes.ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { toHttpResponse } from '@shared/errors/to-http';

export const buildQuotesRoutes = (deps: AppDeps) => {
  const r = new OpenAPIHono<AppEnv>();

  const createRouteSpec = createRoute({
    method: 'post',
    path: '/',
    request: { body: { content: { 'application/json': { schema: CreateQuoteInput } } } },
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: QuoteDto } } },
      422: { description: 'Validation error' },
    },
  });

  r.openapi(createRouteSpec, async (c) => {
    const result = await createQuoteHandler(
      { repo: createQuotesRepo(deps.db), eventBus: deps.eventBus, logger: c.get('logger'), clock: deps.clock, userId: c.get('auth')!.userId },
      c.req.valid('json'),
    );
    return toHttpResponse(c, result, 201);
  });

  return r;
};
```

### Paso 6 — Tests (→ [testing](references/testing.md))

```ts
// features/quotes/routes.test.ts
import { describe, test, expect } from 'bun:test';
import { buildApp } from '@/app';

describe('POST /quotes', () => {
  test('201 con input válido', async () => {
    const app = buildApp(testDeps);
    const res = await app.request('/quotes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customerId: crypto.randomUUID(), items: [{ sku: 'A', qty: 1 }] }),
    });
    expect(res.status).toBe(201);
  });
});
```

---

## 7. Flujo: bootstrap de proyecto nuevo

```bash
# 1. Copiar el skeleton
cp -r <skill-dir>/assets/project-skeleton/ ./mi-api

# 2. Instalar deps
cd mi-api && bun install

# 3. Configurar env
cp .env.example .env
# editar DATABASE_URL, PORT, LOG_LEVEL

# 4. Crear DB y correr migraciones
bun run db:migrate

# 5. Dev
bun run dev
# server en http://localhost:3000
# docs en http://localhost:3000/docs
# metrics en http://localhost:3000/metrics
```

Ver [config](references/config.md) y [lifecycle](references/lifecycle.md) para detalles.

---

## 8. Snippets canónicos inline

### Result<T,E>

```ts
// shared/result.ts
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
export const success = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const failure = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

### AppError tagged union

```ts
// shared/errors/app-error.ts
export type AppError =
  | { kind: 'NotFound'; resource: string; id: string }
  | { kind: 'Unauthorized'; reason?: string }
  | { kind: 'Forbidden'; reason?: string }
  | { kind: 'Validation'; issues: { path: string; message: string }[] }
  | { kind: 'Conflict'; reason: string }
  | { kind: 'Unknown'; cause?: unknown };
```

### Shape de command handler

```ts
export type CommandHandler<In, Out> = (
  deps: CommandDeps,
  input: In,
) => Promise<Result<Out, AppError>>;
```

### Shape de query handler

```ts
export type QueryHandler<In, Out> = (
  ctx: ReadContext,
  input: In,
) => Promise<Result<Out, AppError>>;
```

### Repository factory

```ts
export const createXRepo = (db: Db) => ({
  findById: async (id: string) => /* ... */,
  save: async (entity) => /* ... */,
  delete: async (id: string) => /* ... */,
});
```

---

## 9. Anti-patrones (qué NO hacer)

| Anti-patrón | Por qué duele | Qué hacer en su lugar |
|---|---|---|
| `throw new Error('not found')` en handler | Tipo de retorno miente; consumidor no sabe que puede fallar | `return failure({ kind: 'NotFound', ... })` |
| `throw` en `VerifyFn` (auth middleware) | Un token inválido o una red caída tiran el middleware → 500 global | Return `null`; el middleware decide 401. Ver `references/auth.md` |
| `fetch` sin `try/catch` en handler/route | Error de red explota como 500 no controlado | Wrap en `try/catch`, retornar `failure({ kind: 'Unknown' })` o 502 |
| `c.req.json()` directo en ruta | Sin validación, sin tipos, sin OpenAPI | `zValidator('json', schema)` o `createRoute` con `request.body` |
| Repo con `findAll()`, `findByCustomer()`, `findActive()` | El repo se vuelve God object; los reads necesitan flexibility distinta | Query handler con `ReadContext` y proyección directa |
| Clase `QuotesService` con `_repo`, `_logger` privados | Constructor + mocks complejos; no compone | Factory function que cierra sobre deps |
| Lógica de negocio en middleware | Difícil de testear, mezcla concerns | Middleware solo: auth, request-id, logging, error mapping |
| Mockear el módulo `db/client` con `mock.module()` | Frágil, acoplado a estructura interna | Pasar `Db` mockeado como dep al handler |
| Importar `features/A` desde `features/B` | Acopla slices; rompe la promesa de vertical slice | Domain event o join en read-side |
| Exponer el agregado completo en GET | Filtra detalles internos, viola encapsulación | DTO específico del endpoint, proyectado en query handler |
| Over-engineering: agregar helpers no solicitados (`mapResult`, `flatMap`, factories, etc.) | YAGNI violado; superficie de API crece sin necesidad | Implementar solo lo que pide el spec. Agregar helpers cuando se repiten 3+ veces |
| `buildXRoutes()` sin parámetro `deps` | Rompe inyección de dependencias; tests no pueden mockear | `buildXRoutes(deps: AppDeps)` siempre, aunque no use todas las deps |
| Casts inseguros (`as object`, `as any`) | Erosión de type safety; errores en runtime | Tipar correctamente o usar constraints (`extends JSONValue`) |
| Test data que viola contratos Zod (ej. `'u1'` en campo `uuid()`) | Test pasa pero no valida el contrato real | Usar `crypto.randomUUID()` o datos que satisfagan el schema |
| JSDoc / comments / identifiers en español | Regla del skill: docs en español, código en inglés | Identifiers y JSDoc en inglés siempre |

---

## 10. Tabla de referencia rápida

| Situación | Ir a |
|---|---|
| ¿Por qué vertical slice? ¿Cómo se relaciona con CQRS? | [references/architecture.md](references/architecture.md) |
| Cómo componer rutas, sub-apps, RPC inference | [references/routing.md](references/routing.md) |
| Forma exacta del command handler y deps | [references/commands.md](references/commands.md) |
| Forma exacta del query handler y ReadContext | [references/queries.md](references/queries.md) |
| Qué métodos puede tener un repo | [references/repositories.md](references/repositories.md) |
| Por qué queries bypassan el repo | [references/read-context.md](references/read-context.md) |
| Cómo inyectar deps sin contenedor | [references/di.md](references/di.md) |
| Validación con Zod, infer, discriminated unions | [references/validation.md](references/validation.md) |
| Result pattern, AppError, mapeo a HTTP | [references/errors.md](references/errors.md) |
| Setup de @hono/zod-openapi + Scalar | [references/openapi.md](references/openapi.md) |
| Pino, request-id, /healthz, /metrics | [references/observability.md](references/observability.md) |
| Drizzle vs Kysely vs Bun.sql side-by-side | [references/database.md](references/database.md) |
| env.ts con Zod, fail fast | [references/config.md](references/config.md) |
| Patterns de bun:test, app.request, mocks | [references/testing.md](references/testing.md) |
| Slot de autenticación, requireAuth/Role | [references/auth.md](references/auth.md) |
| Domain events in-process, flush post-commit | [references/events.md](references/events.md) |
| Cliente tipado para FE (`hc<typeof app>`) | [references/rpc-client.md](references/rpc-client.md) |
| Bun.serve, SIGTERM, /readyz, drain DB | [references/lifecycle.md](references/lifecycle.md) |

---

## 11. Cómo scaffoldear un feature

```bash
bun run scripts/scaffold-feature.ts quotes
# Output:
#   src/features/quotes/commands/create-quote.ts
#   src/features/quotes/queries/get-quote-by-id.ts
#   src/features/quotes/repository.ts
#   src/features/quotes/read-context.ts
#   src/features/quotes/schemas.ts
#   src/features/quotes/events.ts
#   src/features/quotes/routes.ts
#   src/features/quotes/routes.test.ts
```

Flags:
- `--no-events` — omite `events.ts`.
- `--with-tests` (default `true`) — incluye `routes.test.ts`.

El script falla si la carpeta ya existe. Después de scaffold:
1. Editar `schemas.ts` con el dominio real.
2. Editar `commands/create-<feature>.ts` y `queries/get-<feature>-by-id.ts`.
3. Mountear en `app.ts`: `app.route('/<features>', build<Feature>Routes(deps))`.

---

## 12. Checklist pre-PR

- [ ] Todo input HTTP validado con Zod.
- [ ] Handlers retornan `Result<T, AppError>`, no `throw`.
- [ ] Repositorios solo tienen `findById`, `save`, `delete` (write-side).
- [ ] Queries usan `ReadContext`, no instancian repo.
- [ ] Cada ruta tiene `createRoute` con responses tipadas (incluye errores).
- [ ] OpenAPI doc visible y correcta en `/docs`.
- [ ] Logs estructurados con `requestId` propagado.
- [ ] Config validada al boot (env.ts con Zod parse top-level).
- [ ] Tests unit (handler con deps mockeadas) y al menos uno integration (`app.request()`).
- [ ] Sin importaciones cross-feature directas.
- [ ] Sin `throw` fuera del boundary (boot, programmer errors).

---

## Notas finales

- **Idioma:** docs en español, identificadores y JSDoc en inglés. Mensajes de error técnico en inglés (viajan a logs/APIs).
- **Coexistencia con .NET:** este skill convive con `cqrs-commands`/`cqrs-queries` (.NET). Cuando el usuario habla de un endpoint sin especificar stack, preguntar; si el repo es claramente Bun/Node/Hono, activar este.
- **No reinventar:** todo lo nuclear vive en `shared/` y se reusa. Si algo se repite entre features, mover a `shared/`.
