# API (Hono + Bun)

API opinada en TypeScript con modular monolith + CQRS lite. Scaffold del skill
`hono-bun-api`.

## Stack

- **Bun** >= 1.1 (runtime, test, package manager)
- **Hono 4** + `@hono/zod-openapi` + Scalar UI
- **Zod 3** (validacion + OpenAPI)
- **Drizzle ORM** + postgres.js
- **Supabase Auth** opcional via JWT
- **Pino** (structured logs)
- **prom-client** (`/metrics`)

## Bootstrap

```bash
bun install --frozen-lockfile
cp .env.example .env
# editar DATABASE_URL (Supabase Postgres URL funciona) y SUPABASE_*
bun run db:migrate
bun run typecheck
bun test
bun run dev
```

- `bun.lock` esta versionado; usa `bun install --frozen-lockfile` para instalaciones reproducibles.
- `db:migrate` aplica la migracion inicial de `examples`, incluida la columna `owner_id`.
- Server: http://localhost:3000
- Docs: http://localhost:3000/docs (en produccion requiere `EXPOSE_DOCS=true`)
- Healthz: http://localhost:3000/healthz
- Readyz: http://localhost:3000/readyz
- Metrics: http://localhost:3000/metrics (en produccion requiere `EXPOSE_METRICS=true`)

## Auth (Supabase)

`src/shared/auth/supabase.ts` trae `createSupabaseVerify`. En `src/app.ts` se
conecta automaticamente con `SUPABASE_JWKS_URL` (preferido) o
`SUPABASE_JWT_SECRET` para proyectos HS256 existentes.

Si no configurás un verificador, las requests caen como anónimas sólo fuera de
producción. Las rutas del scaffold son privadas y devuelven `Unauthorized`; los
use cases/policies deciden ownership y autorización fina.

## Estructura

```txt
src/
  server.ts
  app.ts
  container.ts
  shared/
    db/
    errors/
    events/
    middlewares/
  features/
    examples/
      controller/
      routes/
      repository/
      utils/
      use-cases/
        commands/
        queries/
      examples.constants.ts
      examples.schemas.ts
      examples.types.ts
      index.ts
```

## Crear Una Feature Nueva

```bash
bun run scaffold project
```

El scaffold genera rutas autenticadas y una prueba HTTP autocontenida con un fake en memoria. Luego:

1. Definir tabla en `src/shared/db/schema.ts`.
2. Registrar repository/read model en `src/container.ts`.
3. Montar rutas en `src/app.ts`.
4. Reemplazar los adapters Drizzle placeholder por consultas para la tabla nueva.

```ts
import { buildProjectsRoutes } from '@features/projects';

app.route('/projects', buildProjectsRoutes(container));
```

Cada feature declara `ProjectsUseCasesDeps` en `use-cases/projects.use-cases.ts`; el route builder recibe ese contrato en vez de `AppContainer`. El composition root debe satisfacerlo cuando conectes la feature.

## Convenciones

1. Hono solo adapta HTTP.
2. Use cases no importan Hono.
3. Utils no importan Hono, Drizzle, Supabase ni Bun.
4. Repository concentra persistencia y read models de la feature.
5. Commands protegen invariantes y writes.
6. Queries usan read models/Drizzle y devuelven DTOs.
7. Zod valida input HTTP; utils/use-cases validan negocio.
8. Supabase es infraestructura, no arquitectura.
9. Endpoints públicos/caros usan rate limit o backpressure.
10. Llamadas externas usan timeout; retries solo si son idempotentes.
11. Cache solo con invalidación definida.

## Testing

```bash
bun test
```

- **Unit:** utils/policies/use-cases con deps fake.
- **Integration:** repositories/read models contra pglite o testcontainers.
- **HTTP integration:** `app.request(url, init)` sin abrir puerto.

## CI

```bash
bun run check
```

Corre `check:boundaries`, `typecheck`, `test` y `build`.

`check:boundaries` evita imports internos entre features y cualquier import desde
`shared` hacia `features`.

Helpers incluidos:

- `src/shared/utils/timeout.ts`
- `src/shared/utils/retry.ts`
- `src/shared/middlewares/rate-limit.ts` (in-memory, opt-in)
