# API (Hono + Bun)

Opinionated TypeScript API scaffold for a modular monolith with lightweight CQRS.

## Stack

- Bun >= 1.1
- Hono 4 with `@hono/zod-openapi` and Scalar UI
- Zod 3 for HTTP validation and OpenAPI schemas
- Drizzle ORM with postgres.js
- Optional Supabase JWT authentication
- Pino structured logs and `prom-client` metrics

## Start

```bash
bun install
cp .env.example .env
# Set DATABASE_URL and optional SUPABASE_* values.
bun run db:migrate
bun run dev
```

- Server: http://localhost:3000
- Docs: http://localhost:3000/docs
- Health: http://localhost:3000/healthz
- Metrics: http://localhost:3000/metrics

## Feature Layout

```txt
src/features/examples/
  use-cases/
    commands/
      create-example.command.ts
      create-example.command.test.ts
      update-example.command.ts
    queries/
      get-example-by-id.query.ts
      list-examples.query.ts
  __tests__/
    examples.integration.ts
  examples.constants.ts
  examples.events.ts
  examples.events.test.ts
  examples.routes.ts
  examples.schemas.ts
  examples.types.ts
  index.ts
```

`<feature>.routes.ts` is the feature's sole HTTP adapter. It validates HTTP input,
reads request-scoped values, invokes operations, and maps `Result` values to HTTP.
It does not contain business rules or SQL.

Each command or query receives only the dependencies it uses. Commands receive
explicit `TransactionManager`, `EventBus`, and clock dependencies; queries receive
`Db`. Both use Drizzle directly, project endpoint DTOs, and keep row-to-DTO mapping
in the operation file. Feature-root `*.events.ts` and `*.constants.ts` contain
shared local contracts. Do not generate `controller/`, `routes/`, `repository/`, or
`utils/` directories by default.

## Scaffold A Feature

```bash
bun run scaffold project
```

Then:

1. Define and export the feature table in `src/shared/db/schema.ts`.
2. Run `bun run db:generate` to create the migration.
3. Pass only the required `db`, `tx`, `eventBus`, and `clock` dependencies from `src/di-container.ts`.
4. Mount the feature's public `buildProjectsRoutes` export in `src/app.ts`.
5. Replace the generated example operation fields with the table's actual fields.

## Tests

Operation-level pure tests live next to their source. HTTP and database integration
tests live in `src/features/<feature>/__tests__/` and run against real Postgres.

```bash
# Unit and scaffold tests. No database required.
bun test

# Start the isolated Postgres service, run integration tests, then remove it.
bun run test:db:up
bun run test:integration
bun run test:db:down
```

`docker-compose.test.yml` exposes Postgres at
`postgresql://postgres:postgres@localhost:54329/app_test`. The integration helper
creates and truncates the example table for each container; application projects
should instead run their real migrations before integration tests.

## Checks

```bash
bun run check
```

This runs boundary checks, type checking, unit tests, and the production build.
Run the Docker Compose integration sequence separately when changing database or
HTTP behavior.
