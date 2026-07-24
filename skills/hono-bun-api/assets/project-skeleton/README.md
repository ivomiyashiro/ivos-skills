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

## Arrancar

```bash
bun install
cp .env.example .env
# editar DATABASE_URL (Supabase Postgres URL funciona) y SUPABASE_*
bun run db:migrate
bun run dev
```

- Server: http://localhost:3000
- Docs: http://localhost:3000/docs
- Healthz: http://localhost:3000/healthz
- Readyz: http://localhost:3000/readyz
- Metrics: http://localhost:3000/metrics

## Auth (Supabase)

`src/shared/auth/supabase.ts` trae `createSupabaseVerify`. En `src/app.ts` se
conecta automaticamente si `SUPABASE_JWT_SECRET` esta definido.

Si `SUPABASE_JWT_SECRET` queda vacio, las requests caen como anonimas. Las rutas
que requieran identidad deben cortar con `Unauthorized`/`Forbidden` desde
use-cases/utils.

## Estructura

```txt
src/
  server.ts
  app.ts
  di-container.ts
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

Luego:

1. Definir tabla en `src/shared/db/schema.ts`.
2. Registrar repository/read model en `src/di-container.ts`.
3. Montar rutas en `src/app.ts`.

```ts
import { buildProjectsRoutes } from '@features/projects';

app.route('/projects', buildProjectsRoutes({ projectReadModel: dependencies.projectReadModel }));
```

## Convenciones

1. Hono solo adapta HTTP.
2. Use cases no importan Hono.
3. Utils no importa Hono, Drizzle, Supabase ni Bun.
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
