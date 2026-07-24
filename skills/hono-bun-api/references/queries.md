# Queries

Las queries leen datos y devuelven DTOs optimizados para el consumidor. No cargan
modelos de write-side salvo que haya una razón excepcional.

## Ubicación

```txt
features/projects/use-cases/queries/
  get-project-dashboard.query.ts
  list-projects.query.ts
```

## Forma Recomendada

```ts
export type GetProjectDashboardQuery = {
  organizationId: string;
  projectId: string;
  actorId: string;
};

export type GetProjectDashboardDeps = {
  db: Db;
  permissions: PermissionService;
};

export const getProjectDashboardQuery = async (
  deps: GetProjectDashboardDeps,
  query: GetProjectDashboardQuery,
): Promise<Result<ProjectDashboardDto, AppError>> => {
  const canRead = await deps.permissions.canReadProject({
    actorId: query.actorId,
    organizationId: query.organizationId,
    projectId: query.projectId,
  });

  if (!canRead) return failure(forbidden('project access denied'));

  const rows = await deps.db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      tasksCount: sql<number>`count(${tasks.id})`,
    })
    .from(projects)
    .leftJoin(tasks, eq(tasks.projectId, projects.id))
    .where(and(eq(projects.organizationId, query.organizationId), eq(projects.id, query.projectId)))
    .groupBy(projects.id)
    .limit(1);
  const dashboard = rows[0] ?? null;
  if (!dashboard) return failure(notFound('Project', query.projectId));

  return success(dashboard);
};
```

## Drizzle Directo

```ts
const rows = await deps.db
  .select({ projectId: projects.id, projectName: projects.name })
  .from(projects)
  .where(eq(projects.id, query.projectId));
```

## Reglas

- Proyectar solo campos del DTO público.
- Usar joins para evitar N+1.
- Usar cursor pagination en listados grandes.
- Filtrar siempre por tenant/organization cuando aplique.
- Usar raw SQL/CTE/window functions cuando Drizzle builder queda forzado.
- Mantener queries read-only: nada de insert/update/delete.
- Mantener el mapping row-a-DTO dentro de la query que posee el DTO.
- Si un command reutiliza una lectura, exportarla desde esta carpeta; no moverla ni duplicarla en `use-cases/commands/`.

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

- Query usando un repository o read model por costumbre para responder un dashboard/listado.
- Cargar entidad completa y mapearla en memoria.
- Reutilizar DTO de DB como contrato público.
- Offset pagination en tablas grandes.
- Query sin filtro de tenant en app multi-tenant.
