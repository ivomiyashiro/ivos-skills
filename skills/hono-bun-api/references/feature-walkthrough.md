# Feature Walkthrough: Crear Una Feature Completa

Esta guía usa `projects` como ejemplo. La feature se mantiene plana y navegable:
una route HTTP, commands, queries, contratos locales y tests de integración.

## 1. Estructura

```txt
features/projects/
  use-cases/
    commands/
      create-project.command.ts
    queries/
      list-projects.query.ts
  __tests__/
    projects.integration.ts
  projects.constants.ts
  projects.errors.ts
  projects.events.ts
  projects.routes.ts
  projects.schemas.ts
  projects.types.ts
  index.ts
```

No crear `controller/`, `routes/`, `repository/` ni `utils/` por default.

## 2. Schemas HTTP

```ts
// features/projects/projects.schemas.ts
import { z } from '@hono/zod-openapi';

export const CreateProjectInput = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(80),
});

export const ProjectDto = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
});
```

Zod valida el shape del request. Las invariantes de negocio van en el command y en
helpers puros privados de la operación cuando son necesarios.

## 3. Command Con Drizzle Directo

```ts
// features/projects/use-cases/commands/create-project.command.ts
export type CreateProjectCommand = {
  organizationId: string;
  name: string;
  ownerId: string;
};

export type CreateProjectDeps = {
  tx: TransactionManager;
  eventBus: EventBus;
  clock: Clock;
};

export const createProjectCommand = async (
  deps: CreateProjectDeps,
  command: CreateProjectCommand,
): Promise<Result<{ id: string }, AppError>> => {
  return deps.tx.run(async (db) => {
    const [project] = await db
      .insert(projects)
      .values({
        organizationId: command.organizationId,
        name: command.name,
        ownerId: command.ownerId,
        createdAt: deps.clock.now(),
      })
      .returning({ id: projects.id });

    if (!project) throw new Error('Project insert did not return a row');
    deps.eventBus.publish(projectCreated(project.id));
    return success(project);
  });
};
```

El command recibe solo las deps que utiliza. Abrir una transacción cuando hay varios
writes, outbox o rollback atómico. Extraer un helper o repository solo si hay
complejidad concreta o reutilización comprobada.

## 4. Query Con Drizzle Directo

```ts
// features/projects/use-cases/queries/list-projects.query.ts
export type ListProjectsQuery = { organizationId: string; limit: number };
export type ListProjectsDeps = { db: Db };

export const listProjectsQuery = async (
  deps: ListProjectsDeps,
  query: ListProjectsQuery,
): Promise<Result<ProjectDto[], AppError>> => {
  const rows = await deps.db
    .select({ id: projects.id, name: projects.name, createdAt: projects.createdAt })
    .from(projects)
    .where(eq(projects.organizationId, query.organizationId))
    .orderBy(desc(projects.createdAt), desc(projects.id))
    .limit(query.limit);

  return success(rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  })));
};
```

La query posee la proyección y el mapping a DTO. Si un command necesita esta lectura,
la importa desde `use-cases/queries/`; no la duplica ni la mueve a `use-cases/commands/`.

## 5. Route HTTP Fina

```ts
// features/projects/projects.routes.ts
export type ProjectsRouteDeps = {
  db: Db;
  tx: TransactionManager;
  eventBus: EventBus;
  clock: Clock;
};

export const buildProjectsRoutes = (deps: ProjectsRouteDeps) => {
  const routes = createApiRouter();

  routes.openapi(createRoute({ method: 'post', path: '/', /* schemas */ }), async (c) =>
    toHttpResponse(
      c,
      await createProjectCommand(
        { tx: deps.tx, eventBus: deps.eventBus, clock: deps.clock },
        { ...c.req.valid('json'), ownerId: c.get('auth')!.userId },
      ),
      201,
    ),
  );

  return routes;
};
```

La route valida input, toma valores request-scoped, invoca la operación y convierte
`Result` a HTTP. No contiene reglas de negocio, SQL ni transacciones.

## 6. Container Y App

```ts
// di-container.ts
return { db, tx, eventBus, clock };

// app.ts
app.route('/projects', buildProjectsRoutes({
  db: dependencies.db,
  tx: dependencies.tx,
  eventBus: dependencies.eventBus,
  clock: dependencies.clock,
}));
```

El composition root crea recursos globales una vez. La feature recibe un objeto local
con las deps necesarias; commands y queries reciben subconjuntos explícitos.

## 7. Tests

- Los tests unitarios cubren solo lógica pura y quedan junto a su operación.
- Los tests HTTP y DB viven en `features/projects/__tests__/`.
- Usar `app.request()` con el composition root real y Postgres de Docker Compose.
- Preload de env de test, ejecutar migraciones reales y preparar seed antes de tests.
- No mockear database ni Supabase en integration.

## Checklist

- [ ] La feature tiene una única `<feature>.routes.ts` fina.
- [ ] Commands/queries exportan `<verb><Noun>Command|Query` y reciben deps explícitas.
- [ ] Commands/queries usan Drizzle directo por default.
- [ ] Mapping vive con la operación dueña.
- [ ] Reads reutilizados por commands permanecen en `use-cases/queries/`.
- [ ] Helpers/repositories se extraen solo con complejidad o reutilización concreta.
- [ ] Transactions envuelven múltiples writes/outbox.
