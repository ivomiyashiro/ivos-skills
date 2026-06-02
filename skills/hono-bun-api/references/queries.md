# Queries

Las queries leen datos y devuelven DTOs optimizados para el consumidor. No cargan
agregados ni usan repositorios de write-side salvo que haya una razon excepcional.

## Ubicacion

```txt
modules/projects/application/
  queries/get-project-dashboard.query.ts
  handlers/get-project-dashboard.handler.ts

modules/projects/infrastructure/
  project-read-model.ts
```

## Forma Recomendada

```ts
export type GetProjectDashboardQuery = {
  organizationId: string;
  projectId: string;
  actorId: string;
};

export type GetProjectDashboardDeps = {
  readModel: ProjectReadModel;
  permissions: PermissionService;
};

export const getProjectDashboardHandler = async (
  deps: GetProjectDashboardDeps,
  query: GetProjectDashboardQuery,
): Promise<Result<ProjectDashboardDto, AppError>> => {
  const canRead = await deps.permissions.canReadProject({
    actorId: query.actorId,
    organizationId: query.organizationId,
    projectId: query.projectId,
  });

  if (!canRead) return failure(forbidden('project access denied'));

  const dashboard = await deps.readModel.getDashboard(query);
  if (!dashboard) return failure(notFound('Project', query.projectId));

  return success(dashboard);
};
```

## Read Model Con Drizzle

```ts
export class ProjectReadModel {
  constructor(private readonly db: Db) {}

  async getDashboard(query: GetProjectDashboardQuery) {
    const rows = await this.db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        tasksCount: sql<number>`count(${tasks.id})`,
      })
      .from(projects)
      .leftJoin(tasks, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(projects.organizationId, query.organizationId),
          eq(projects.id, query.projectId),
        ),
      )
      .groupBy(projects.id)
      .limit(1);

    return rows[0] ?? null;
  }
}
```

## Reglas

- Proyectar solo campos del DTO publico.
- Usar joins para evitar N+1.
- Usar cursor pagination en listados grandes.
- Filtrar siempre por tenant/organization cuando aplique.
- Usar raw SQL/CTE/window functions cuando Drizzle builder queda forzado.
- Mantener queries read-only: nada de insert/update/delete.

## Cursor Pagination

Preferir cursor por `(createdAt, id)` o por el campo real de orden + desempate.

```ts
const rows = await db
  .select(...)
  .from(projects)
  .where(
    and(
      eq(projects.organizationId, organizationId),
      cursor
        ? or(
            lt(projects.createdAt, cursor.createdAt),
            and(eq(projects.createdAt, cursor.createdAt), lt(projects.id, cursor.id)),
          )
        : undefined,
    ),
  )
  .orderBy(desc(projects.createdAt), desc(projects.id))
  .limit(limit + 1);
```

## Anti-Patrones

- Query handler llamando `projectRepo.findById()` para responder un GET.
- Cargar agregado completo y mapearlo en memoria.
- Reutilizar DTO de DB como contrato publico.
- Offset pagination en tablas grandes.
- Query sin filtro de tenant en app multi-tenant.
