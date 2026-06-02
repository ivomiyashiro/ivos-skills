# Module Walkthrough: Crear Un Modulo Completo

Esta guia usa `projects` como ejemplo. El objetivo es que el modulo quede navegable:
HTTP adapter, application, domain e infrastructure.

## 1. Schemas HTTP

```ts
// modules/projects/projects.schemas.ts
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

Zod valida shape del request. Las invariantes de negocio van en domain/application.

## 2. Domain

```ts
// modules/projects/domain/project.entity.ts
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
// modules/projects/domain/project.repository.ts
export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Domain no importa Hono, Drizzle ni Supabase.

## 3. Infrastructure

```ts
// modules/projects/infrastructure/drizzle-project.repository.ts
export class DrizzleProjectRepository implements ProjectRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string) {
    const row = await this.db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    return row ? ProjectMapper.toDomain(row) : null;
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
// modules/projects/infrastructure/project-read-model.ts
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
// modules/projects/application/commands/create-project.command.ts
export type CreateProjectCommand = {
  organizationId: string;
  name: string;
  ownerId: string;
};
```

```ts
// modules/projects/application/handlers/create-project.handler.ts
export const createProjectHandler = async (
  deps: CreateProjectDeps,
  command: CreateProjectCommand,
): Promise<Result<{ id: string }, AppError>> => {
  return deps.tx.run(async (db) => {
    const orgRepo = deps.createOrganizationRepo(db);
    const projectRepo = deps.createProjectRepo(db);

    const org = await orgRepo.findById(command.organizationId);
    if (!org) return failure(notFound('Organization', command.organizationId));
    if (!org.canCreateProject(command.ownerId)) return failure(forbidden());

    const project = Project.create({ ...command, now: deps.clock.now() });
    await projectRepo.save(project);

    return success({ id: project.id });
  });
};
```

## 5. Queries

```ts
// modules/projects/application/handlers/list-projects.handler.ts
export const listProjectsHandler = async (
  deps: { readModel: ProjectReadModel },
  query: ListProjectsQuery,
) => {
  return success(await deps.readModel.listByOrganization(query));
};
```

Queries devuelven DTOs/read models. No usar repositorios de write-side para listados.

## 6. Controller

```ts
// modules/projects/projects.controller.ts
export const createProjectController =
  (container: AppContainer) =>
  async (c: Context<AppEnv>) => {
    const result = await createProjectHandler(
      {
        createProjectRepo: container.createProjectRepository,
        createOrganizationRepo: container.createOrganizationRepository,
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
// modules/projects/projects.routes.ts
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

- Domain: entity/policy unit tests.
- Application: handler tests con repos fake.
- Infrastructure: repository/read model contra DB real.
- HTTP: `app.request()` con container de test.

## Checklist

- [ ] Domain no importa frameworks.
- [ ] Commands pasan por repositorios/write-side.
- [ ] Queries usan read models/Drizzle.
- [ ] Controllers no tienen reglas.
- [ ] Transactions envuelven multiples writes/outbox.
- [ ] DTOs no exponen rows internas.
