# Repositories

Los repositories son fronteras de persistencia de una feature. No son una
abstracción universal de SQL.

## Ubicación

```txt
features/projects/repository/
  project.repository.ts
  drizzle-project.repository.ts
  project.mapper.ts
  project-read-model.ts
```

## Contrato

```ts
export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Permitir otros métodos solo si son necesarios para write-side:

- `findByNaturalId`
- `findByIdempotencyKey`
- `existsBySlug`

No agregar listados, search, stats o DTOs.

## Implementación Drizzle

```ts
export class DrizzleProjectRepository implements ProjectRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Project | null> {
    const row = await this.db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    return row ? ProjectMapper.toEntity(row) : null;
  }

  async save(project: Project): Promise<void> {
    const row = ProjectMapper.toPersistence(project);

    await this.db
      .insert(projects)
      .values(row)
      .onConflictDoUpdate({
        target: projects.id,
        set: row,
      });
  }
}
```

## Mappers

El mapper traduce entre persistencia y entidad/modelo local:

```ts
export const ProjectMapper = {
  toEntity(row: ProjectRow): Project {
    return Project.rehydrate({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(project: Project): ProjectInsert {
    return {
      id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  },
};
```

## Buen Uso

Usar repository cuando:

- se necesita mutar estado
- hay invariantes que proteger
- se requiere optimistic locking/versionado
- el command necesita cargar estado antes de decidir

No usar repository de write-side cuando:

- se arma un dashboard
- se lista con filtros
- se busca texto
- se calculan stats
- se devuelve un DTO read-only

Para esos casos, crear un read model en `repository/` o usar Drizzle directo desde
la query si la consulta es chica.

## Transacciones

Si el command corre dentro de transacción, crear repos con el handle transaccional:

```ts
await tx.run(async (db) => {
  const repo = new DrizzleProjectRepository(db);
  await repo.save(project);
});
```

## Anti-Patrones

- `ProjectRepository.list(...)`
- `ProjectRepository.getDashboard(...)`
- repo que retorna DTOs públicos
- repo que importa Hono/logger/auth
- repo que contiene reglas de negocio
- repo compartido entre features sin ownership claro
