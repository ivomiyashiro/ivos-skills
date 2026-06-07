# Read Models

La versión anterior de esta skill usaba `ReadContext` como patrón principal. En el
layout actual, preferir **read models** en `repository/` para queries complejas o
recurrentes.

## Forma

```ts
// features/projects/repository/project-read-model.ts
export class ProjectReadModel {
  constructor(private readonly db: Db) {}

  async getDashboard(query: GetProjectDashboardQuery): Promise<ProjectDashboardDto | null> {
    // Drizzle projection directa a DTO
  }
}
```

## Cuándo Usar Db Raw En Query

Para queries muy chicas, el use case puede recibir `{ db }` directo. Si la query
crece, extraer a read model.

## Reglas

- Read models devuelven DTOs/read shapes, no entidades de write-side.
- Read models pueden usar joins, CTEs o raw SQL.
- No mutar estado desde read models.
- No reutilizar repositories de write-side para listados.

## Compartir Reads

Si una proyección se repite en la misma feature, helper privado o read model. Si se
repite entre features, evaluar si es un concepto shared real o si cada feature debe
mantener su propio DTO.
