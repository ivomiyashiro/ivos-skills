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
application/domain.

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
  modules/
    examples/
      examples.routes.ts
      examples.controller.ts
      examples.schemas.ts
      application/
      domain/
      infrastructure/
```

## Crear Un Modulo Nuevo

```bash
bun run scaffold project
```

Luego:

1. Definir tabla en `src/shared/db/schema.ts`.
2. Registrar repository/read model en `src/container.ts`.
3. Montar rutas en `src/app.ts`.

```ts
import { buildProjectsRoutes } from '@modules/projects/projects.routes';

app.route('/projects', buildProjectsRoutes(container));
```

## Convenciones

1. Hono solo adapta HTTP.
2. Application handlers no importan Hono.
3. Domain no importa Hono, Drizzle, Supabase ni Bun.
4. Repository interfaces viven en domain; Drizzle implementations en infrastructure.
5. Commands protegen invariantes y writes.
6. Queries usan read models/Drizzle y devuelven DTOs.
7. Zod valida input HTTP; domain valida negocio.
8. Supabase es infraestructura, no arquitectura.

## Testing

```bash
bun test
```

- **Unit:** domain/policies/application handlers con deps fake.
- **Integration:** repositories/read models contra pglite o testcontainers.
- **HTTP integration:** `app.request(url, init)` sin abrir puerto.

## CI

```bash
bun run check
```

Corre `typecheck`, `test` y `build`.
