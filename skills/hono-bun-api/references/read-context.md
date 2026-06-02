# Read Models

La version anterior de esta skill usaba `ReadContext` como patron principal. En el
layout actual, preferir **read models** en `infrastructure/` para queries complejas
o recurrentes.

## Forma

```ts
// modules/projects/infrastructure/project-read-model.ts
export class ProjectReadModel {
  constructor(private readonly db: Db) {}

  async getDashboard(query: GetProjectDashboardQuery): Promise<ProjectDashboardDto | null> {
    // Drizzle projection directa a DTO
  }
}
```

## Cuándo Usar Db Raw En Handler

Para queries muy chicas, el handler puede recibir `{ db }` directo. Si la query crece,
extraer a read model.

## Reglas

- Read models devuelven DTOs/read shapes, no agregados.
- Read models pueden usar joins, CTEs o raw SQL.
- No mutar estado desde read models.
- No reutilizar repositories de write-side para listados.

## Compartir Reads

Si una proyeccion se repite en el mismo modulo, helper privado o read model. Si se
repite entre modulos, evaluar si es un concepto shared real o si cada modulo debe
mantener su propio DTO.
