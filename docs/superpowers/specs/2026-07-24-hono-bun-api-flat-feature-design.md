# Hono Bun API Flat Feature Design

## Purpose

Update `hono-bun-api` so its guidance, references, project skeleton, and feature
scaffolder use the flat feature architecture validated in OneRM. The skill must no
longer generate structural layers that add no boundary or behavior.

## Feature Layout

Each feature uses this default layout:

```txt
features/projects/
  __tests__/
  use-cases/
    commands/
      create-project.command.ts
    queries/
      get-project.query.ts
      get-project-for-user.query.ts
  projects.constants.ts
  projects.errors.ts
  projects.events.ts
  projects.routes.ts
  projects.schemas.ts
  projects.types.ts
  index.ts
```

The default does not create `controller/`, `routes/`, `repository/`, or `utils/`.
`projects.routes.ts` is the only HTTP adapter. It validates request input, reads
request-scoped data, invokes a command or query, and maps `Result` to HTTP. It does
not contain business rules or SQL.

Commands and queries receive explicit `db`, transaction, event-bus, and adapter
dependencies. They use Drizzle directly by default. A write repository, pure helper,
or mapper is introduced only when it has a concrete reuse or complexity reason, and
is colocated with its owning operation unless it is feature-wide.

## Naming And Dependencies

- `*.command.ts` exports `verbNounCommand`.
- `*.query.ts` exports `verbNounQuery`.
- Commands modify state; queries return read DTOs and do not mutate state.
- Reusable ownership or active-state lookups remain queries in `use-cases/queries/`.
- Feature-wide statuses, limits, and defaults live in `<feature>.constants.ts`.
- Feature domain event names and payloads live in `<feature>.events.ts`.
- Operation-specific row-to-DTO mapping remains in the command/query file.
- Features import other features only through the owner's `index.ts` or events.

## Dependency Injection

`createContainer` is the composition root. `buildApp` receives the root dependencies
and passes each route builder only the values the feature requires. A command or query
receives only its operation dependencies; it never imports a DB singleton or the root
container.

## Testing

Pure transformations and calculations are unit-tested beside their command or query.
Tests requiring Drizzle, Hono, authorization, schema state, or cross-table behavior
are HTTP/DB integrations in `<feature>/__tests__/`.

Integration tests use `app.request()` and a real Postgres instance started by Docker
Compose. The runner preloads a test environment, prepares the schemas needed by
migrations, runs migrations, seeds deterministic data, and executes the selected
feature tests serially. Database and Supabase behavior are not mocked.

## Delivered Surfaces

- `SKILL.md` describes the flat default, direct-Drizzle operations, explicit DI, and
  Compose-backed integration testing.
- Relevant references use the same structure and remove conflicting legacy paths.
- The skeleton contains a working flat example feature and matching route wiring.
- The scaffold template emits the same feature shape.
- The source skill is committed with the repository's version bump hook, then copied
  to the global installed skill and compared for equality.

## Non-Goals

- Do not prescribe repositories or helpers when a single operation is simpler with
  direct Drizzle.
- Do not make all feature tests unit tests or all tests global discovery tests.
- Do not add runtime dependencies or change unrelated skills.
