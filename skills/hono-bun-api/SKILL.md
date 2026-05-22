---
name: hono-bun-api
description: Construir APIs TypeScript opinadas con Hono + Bun siguiendo vertical slice, CQRS lite, Result pattern, Zod, repositorios para escritura y read context para queries. Auth default con Supabase. Usar SIEMPRE que el usuario mencione hono, bun, "crear api typescript", endpoints, rutas, route handler, feature slice, command handler, query handler, repository TS, Drizzle, Kysely, zod-openapi, scaffold de proyecto Bun, OpenAPIHono, Supabase Auth con jose, o pida estructurar/scaffoldear un proyecto TS server-side — incluso si no nombra Hono o Bun explícitamente. NO usar para .NET, MediatR ni EF Core (eso lo cubren cqrs-commands/cqrs-queries/response-pattern).
---

# Skill: Hono + Bun API

API opinada en TypeScript con **vertical slice + CQRS lite**, todo funciones,
Result pattern, Zod en el borde, repositorios solo para escritura, read context
para queries, y Supabase Auth como default.

> **Cómo usar este skill:** este archivo es el overview. Cada sección linkea a
> `references/<tema>.md` con el detalle profundo. Para crear un feature paso a
> paso, usá `references/feature-walkthrough.md`. Para arrancar de cero, copiá
> `assets/project-skeleton/`.

---

## 1. Cuándo usar (triggers)

**Sí, activar cuando:**
- Pide crear una API TypeScript, endpoint, ruta, command/query handler.
- Menciona Hono, Bun, Drizzle, Kysely, Zod, OpenAPIHono, zod-openapi, scaffold de proyecto.
- Pregunta cómo estructurar un feature, repositorio, validación, observabilidad o testing en TS server-side.
- Habla de RPC tipado (`hc<typeof app>`), tests de integración con `app.request()`, graceful shutdown en Bun.
- Menciona Supabase Auth, JWT verification con jose, o cualquier IdP que emita Bearer tokens.

**No activar cuando:**
- Es .NET / MediatR / EF Core (usar `cqrs-commands`, `cqrs-queries`, `response-pattern`, `entity-framework`).
- Es frontend puro (React, Flutter) — aunque la integración FE↔BE sí está cubierta en `references/rpc-client.md`.

---

## 2. Stack opinado

| Capa | Paquete | Por qué |
|---|---|---|
| Runtime | **Bun ≥ 1.1** | HTTP nativo, test runner, dotenv built-in. |
| Framework HTTP | **Hono 4** | Mínimo, type-safe, edge-ready, RPC inference. |
| Validación | **Zod 3** | Mismo Zod genera OpenAPI; tipo inferido sin duplicación. |
| OpenAPI | **@hono/zod-openapi** + **@scalar/hono-api-reference** | Spec derivada del Zod; Scalar UI en `/docs`. |
| Auth | **Supabase Auth** + `jose` para verify | Default; el slot acepta cualquier `VerifyFn` (Auth0, Cognito, mTLS, API keys). |
| Logger | **Pino 9** | Estructurado JSON, child loggers por request. |
| Métricas | **prom-client 15** | `/metrics` Prometheus, sin magia. |
| DB | **Drizzle ORM + postgres.js** | Funciona contra Supabase Postgres URL o cualquier Postgres. Alternativas en `references/database.md`. |
| Testing | **bun:test** + pglite/testcontainers | Built-in, sin config; `app.request()` para integration sin port. |
| Tipos | **TypeScript 5 strict** | `strict`, `noUnusedLocals`, paths `@features/*`, `@shared/*`. |

---

## 3. Principios no negociables

1. **Vertical slice.** Carpetas son features (`src/features/quotes/`), no capas horizontales.
2. **Funciones + closures, sin clases.** Handlers, repositorios, servicios — todo función pura async. DI por factory.
3. **Result pattern, no `throw` para errores de negocio.** `throw` solo para bugs; los atrapa `app.onError`.
4. **Zod en todo borde HTTP.** Ningún handler toca `c.req.json()` directo.
5. **Repositorios solo para escritura.** Métodos permitidos: `save`, `findById`, `delete`. Listados/proyecciones NO viven en el repo.
6. **Queries usan `ReadContext` directo.** `ctx.db` proyecta a DTO sin pasar por agregado.
7. **OpenAPI nace del mismo Zod que valida.** Una sola fuente de verdad.
8. **Auth en el borde, no en cada handler.** `authMiddleware(verify)` corre una vez; `requireAuth` / `requireRole` decoran rutas.

---

## 4. Estructura canónica del proyecto

```
src/
  server.ts                  # Bun.serve + signals (SIGTERM/SIGINT)
  app.ts                     # OpenAPIHono + middlewares globales + mount features
  shared/
    config/env.ts            # Zod-validated env, fail fast al boot
    hono/types.ts            # AppEnv, AppVars, ReadContext
    result.ts                # Result<T,E> + success() + failure()
    errors/                  # AppError + mapper to-http
    middlewares/             # request-id, logger, error-handler, auth
    auth/                    # Supabase verify factory + (otros IdPs opcionales)
    observability/           # Pino, prom-client
    events/event-bus.ts      # In-process EventEmitter wrapper
    db/                      # client, schema (cross-feature), transaction
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

Cada feature es una carpeta autocontenida. Sus dependencias **siempre** apuntan a
`shared/`; nunca a otro feature.

```
features/quotes/
  commands/create-quote.ts
  commands/update-quote.ts
  queries/get-quote-by-id.ts
  queries/list-quotes.ts
  repository.ts
  read-context.ts
  schemas.ts
  events.ts
  routes.ts
  routes.test.ts
```

Cross-feature: **prohibido importarse directo**. Si quotes necesita datos de
customers, lo hace vía:
- Domain event suscripto por quotes y emitido por customers, o
- Un join en read-side (queries de quotes pueden joinear tablas de customers).

Detalle en [`references/architecture.md`](references/architecture.md).

---

## 6. Crear un feature nuevo

Resumen de los 6 pasos (cada uno con su deep-dive):

1. **Schemas Zod** en `schemas.ts` → [validation](references/validation.md)
2. **Repository** write-only → [repositories](references/repositories.md)
3. **Command / Query handlers** con Result → [commands](references/commands.md), [queries](references/queries.md)
4. **Read context** → [read-context](references/read-context.md)
5. **Routes** con OpenAPI + `toHttpResponse` → [routing](references/routing.md), [openapi](references/openapi.md), [errors](references/errors.md)
6. **Tests** unit + integration → [testing](references/testing.md)

Para el walkthrough completo con código de los 6 pasos, ver
[`references/feature-walkthrough.md`](references/feature-walkthrough.md).

---

## 7. Bootstrap de proyecto nuevo

```bash
cp -r <skill-dir>/assets/project-skeleton/ ./mi-api
cd mi-api && bun install
cp .env.example .env
# editar DATABASE_URL (Supabase Postgres OK), SUPABASE_*, etc.
bun run db:migrate
bun run dev
# server  → http://localhost:3000
# docs    → http://localhost:3000/docs
# metrics → http://localhost:3000/metrics
```

Ver [`references/config.md`](references/config.md) y
[`references/lifecycle.md`](references/lifecycle.md).

---

## 8. Auth: Supabase por default

El skill incluye `shared/auth/supabase.ts` con `createSupabaseVerify({ mode, ...})`.
Conectalo en `app.ts`:

```ts
import { createSupabaseVerify } from '@shared/auth/supabase';

app.use('*', authMiddleware(createSupabaseVerify({
  mode: 'hs256',
  jwtSecret: env.SUPABASE_JWT_SECRET,
})));
```

Modo `jwks` para keys asimétricas con rotación. Para otros IdPs (Auth0, Cognito,
API keys, AAAS), el slot acepta cualquier `VerifyFn`. Detalle completo en
[`references/auth.md`](references/auth.md).

---

## 9. Anti-patrones (qué NO hacer)

| Anti-patrón | Por qué duele | Qué hacer en su lugar |
|---|---|---|
| `throw new Error('not found')` en handler | Tipo de retorno miente | `return failure({ kind: 'NotFound', ... })` |
| `c.req.json()` directo en ruta | Sin validación, sin tipos, sin OpenAPI | `zValidator('json', schema)` o `createRoute` con `request.body` |
| Repo con `findAll()`, `findByCustomer()`, `findActive()` | God object; los reads necesitan flexibility distinta | Query handler con `ReadContext` y proyección directa |
| Clase `QuotesService` con `_repo`, `_logger` privados | Constructor + mocks complejos; no compone | Factory function que cierra sobre deps |
| Lógica de negocio en middleware | Difícil de testear, mezcla concerns | Middleware solo: auth, request-id, logging, error mapping |
| Mockear `db/client` con `mock.module()` | Frágil, acoplado a estructura interna | Pasar `Db` mockeado como dep al handler |
| Importar `features/A` desde `features/B` | Acopla slices | Domain event o join en read-side |
| Exponer el agregado completo en GET | Filtra detalles internos | DTO específico del endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` en el proceso user-facing | Bypassa RLS | Mantenerlo en jobs admin separados |

---

## 10. Tabla de referencia rápida

| Situación | Ir a |
|---|---|
| Walkthrough completo de un feature nuevo | [references/feature-walkthrough.md](references/feature-walkthrough.md) |
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
| Supabase Auth + JWT/jose + API keys | [references/auth.md](references/auth.md) |
| Domain events in-process, flush post-commit | [references/events.md](references/events.md) |
| Cliente tipado para FE (`hc<typeof app>`) | [references/rpc-client.md](references/rpc-client.md) |
| Bun.serve, SIGTERM, /readyz, drain DB | [references/lifecycle.md](references/lifecycle.md) |

---

## 11. Cómo scaffoldear un feature

El script espera el nombre **singular** y pluraliza automáticamente:

```bash
bun run scripts/scaffold-feature.ts quote
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
- `--no-tests` — omite `routes.test.ts`.
- `--plural=<plural>` — override de la pluralización automática (ej. `--plural=people`).

El script falla si la carpeta ya existe. Después de scaffold:
1. Editar `schemas.ts` con el dominio real.
2. Definir la tabla en `src/shared/db/schema.ts` y generar migración.
3. Reemplazar los `throw new Error(...)` del `repository.ts` con queries reales.
4. Implementar el query handler.
5. Mountear en `app.ts`: `app.route('/<features>', build<Features>Routes(deps))`.

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
- [ ] Auth conectada: `authMiddleware(verify)` en `app.ts`, `requireAuth` donde corresponda.
- [ ] Tests unit (handler con deps mockeadas) y al menos uno integration (`app.request()`).
- [ ] `bun run typecheck` (o `tsc --noEmit`) pasa sin errores (0 errores TS, `strict` activo).
- [ ] Sin importaciones cross-feature directas.
- [ ] Sin `throw` fuera del boundary (boot, programmer errors).
- [ ] Sin logs de access tokens completos.

---

## Notas finales

- **Idioma:** docs en español, identificadores y JSDoc en inglés. Mensajes de
  error técnico en inglés (viajan a logs/APIs).
- **Coexistencia con .NET:** este skill convive con `cqrs-commands`/`cqrs-queries`
  (.NET). Cuando el usuario habla de un endpoint sin especificar stack, preguntar;
  si el repo es claramente Bun/Node/Hono, activar este.
- **No reinventar:** todo lo nuclear vive en `shared/` y se reusa. Si algo se
  repite entre features, mover a `shared/`.
- **Supabase es default, no obligatorio:** el slot `VerifyFn` acepta cualquier
  fuente de identidad. Si swappeás de IdP, el blast radius es un archivo:
  `shared/auth/<idp>.ts`.
