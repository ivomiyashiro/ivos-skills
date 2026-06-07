# Feature Walkthrough: Crear Una Feature Completa

Esta guía usa `projects` como ejemplo. El objetivo es que la feature quede
navegable: routes, controller, use cases, repository, utils, schemas, constants y
types.

## 1. Schemas HTTP

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

Zod valida shape del request. Las invariantes de negocio van en use cases/utils.

## 2. Utils

```ts
// features/projects/utils/project.entity.ts
export class Project {
  private constructor(private props: ProjectProps) {}

  static create(input: CreateProjectProps) {
    return new Project({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      name: input.name,
      ownerId: input.ownerId,
      status: 'active',
      createdAt: input.now,
      updatedAt: input.now,
    });
  }
}
```

```ts
// features/projects/utils/project.policies.ts
export const canCreateProject = (actorId: string | null) =>
  actorId ? { allowed: true as const } : { allowed: false as const, reason: 'auth required' };
```

Utils no importa Hono, Drizzle ni Supabase.

## 3. Repository

```ts
// features/projects/repository/project.repository.ts
export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
```

```ts
// features/projects/repository/drizzle-project.repository.ts
export class DrizzleProjectRepository implements ProjectRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string) {
    const row = await this.db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    return row ? ProjectMapper.toEntity(row) : null;
  }

  async save(project: Project) {
    const row = ProjectMapper.toPersistence(project);
    await this.db.insert(projects).values(row).onConflictDoUpdate({
      target: projects.id,
      set: row,
    });
  }
}
```

```ts
// features/projects/repository/project-read-model.ts
export class ProjectReadModel {
  constructor(private readonly db: Db) {}

  async listByOrganization(input: ListProjectsQuery) {
    return this.db
      .select({
        id: projects.id,
        name: projects.name,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.organizationId, input.organizationId))
      .orderBy(desc(projects.createdAt), desc(projects.id))
      .limit(input.limit + 1);
  }
}
```

## 4. Commands

```ts
// features/projects/use-cases/commands/create-project.command.ts
export type CreateProjectCommand = {
  organizationId: string;
  name: string;
  ownerId: string;
};

export const createProjectCommand = async (
  deps: CreateProjectDeps,
  command: CreateProjectCommand,
): Promise<Result<{ id: string }, AppError>> => {
  return deps.tx.run(async (db) => {
    const projectRepo = deps.createProjectRepo(db);
    const decision = canCreateProject(command.ownerId);
    if (!decision.allowed) return failure(forbidden(decision.reason));

    const project = Project.create({ ...command, now: deps.clock.now() });
    await projectRepo.save(project);

    return success({ id: project.id });
  });
};
```

## 5. Queries

```ts
// features/projects/use-cases/queries/list-projects.query.ts
export const listProjectsQuery = async (
  deps: { readModel: ProjectReadModel },
  query: ListProjectsQueryRequest,
) => {
  return success(await deps.readModel.listByOrganization(query));
};
```

Queries devuelven DTOs/read models. No usar repositories de write-side para
listados complejos.

## 6. Controller

```ts
// features/projects/controller/projects.controller.ts
export const createProjectController =
  (container: AppContainer) =>
  async (c: Context<AppEnv>) => {
    const result = await createProjectCommand(
      {
        createProjectRepo: container.createProjectRepository,
        tx: container.tx,
        clock: container.clock,
        logger: c.get('logger'),
      },
      { ...c.req.valid('json'), ownerId: c.get('auth')!.userId },
    );

    return toHttpResponse(c, result, 201);
  };
```

Controller adapta HTTP. No contiene reglas de negocio.

## 7. Routes

```ts
// features/projects/routes/projects.routes.ts
export const buildProjectsRoutes = (container: AppContainer) => {
  const r = createApiRouter();

  r.openapi(createRoute({ method: 'post', path: '/', ... }), createProjectController(container));
  r.openapi(createRoute({ method: 'get', path: '/', ... }), listProjectsController(container));

  return r;
};
```

## 8. Container Y App

```ts
// container.ts
const projectReadModel = new ProjectReadModel(db);

return {
  tx,
  projectReadModel,
  createProjectRepository: (db: Db) => new DrizzleProjectRepository(db),
};
```

```ts
// app.ts
app.route('/projects', buildProjectsRoutes(container));
```

## 9. Tests

- Utils: entity/policy unit tests.
- Use cases: command/query tests con repos fake.
- Repository: repository/read model contra DB real.
- HTTP: `app.request()` con container de test.

## Checklist

- [ ] Utils no importan frameworks.
- [ ] Commands pasan por repositories/write-side.
- [ ] Queries usan read models/Drizzle.
- [ ] Controllers no tienen reglas.
- [ ] Transactions envuelven múltiples writes/outbox.
