# Repositories (Excepción)

Los repositories no forman parte del layout default. Commands y queries usan
Drizzle directo con deps explícitas. Extraer un repository es una excepción para
una frontera de persistencia compleja o reutilizada; no una abstracción universal
de SQL.

## Cuándo Extraerlo

Una vez justificado, mantenerlo local a la feature, por ejemplo
`features/projects/project.repository.ts`, junto con el command que lo necesita.
No crear `repository/` por default.

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

El mapping pertenece inicialmente a la operación que posee el DTO. Extraerlo cerca
del repository solo si el mismo mapping de write-side se reutiliza y la complejidad
lo justifica:

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

Para esos casos, usar Drizzle directo desde la query. No crear un read model o
repository solo para ordenar carpetas.

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
- repository compartido entre features sin ownership claro
- extraer un repository antes de que exista complejidad o reutilización concreta
