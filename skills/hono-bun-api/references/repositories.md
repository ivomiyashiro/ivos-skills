# Repositories

Los repositorios son fronteras de persistencia para agregados de dominio. No son una
abstraccion universal de SQL.

## Ubicacion

```txt
modules/projects/domain/project.repository.ts
modules/projects/infrastructure/drizzle-project.repository.ts
modules/projects/infrastructure/project.mapper.ts
```

## Interfaz En Domain

```ts
export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Permitir otros metodos solo si son necesarios para write-side:
- `findByNaturalId`
- `findByIdempotencyKey`
- `existsBySlug`

No agregar listados, search, stats o DTOs.

## Implementacion Drizzle

```ts
export class DrizzleProjectRepository implements ProjectRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Project | null> {
    const row = await this.db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    return row ? ProjectMapper.toDomain(row) : null;
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

  async delete(id: string): Promise<void> {
    await this.db.delete(projects).where(eq(projects.id, id));
  }
}
```

## Mappers

El mapper traduce entre persistencia y dominio:

```ts
export const ProjectMapper = {
  toDomain(row: ProjectRow): Project {
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

Usar repo cuando:
- se necesita mutar un agregado
- hay invariantes que proteger
- se requiere optimistic locking/versionado
- el command necesita cargar estado antes de decidir

No usar repo cuando:
- se arma un dashboard
- se lista con filtros
- se busca texto
- se calculan stats
- se devuelve un DTO read-only

## Transacciones

Si el command corre dentro de transaccion, crear repos con el handle transaccional:

```ts
await tx.run(async (db) => {
  const repo = new DrizzleProjectRepository(db);
  await repo.save(project);
});
```

## Anti-Patrones

- `ProjectRepository.list(...)`
- `ProjectRepository.getDashboard(...)`
- repo que retorna DTOs publicos
- repo que importa Hono/logger/auth
- repo que contiene reglas de negocio
- repo compartido entre modulos sin ownership claro
