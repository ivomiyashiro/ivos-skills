# Read Models

La versión anterior de esta skill usaba `ReadContext` como patrón principal. En el
layout actual, las queries usan Drizzle directo y conservan su mapping en el archivo
de la operación.

## Forma

```ts
// features/projects/use-cases/queries/get-project-dashboard.query.ts
const rows = await deps.db
  .select({ id: projects.id, name: projects.name })
  .from(projects)
  .where(eq(projects.id, query.projectId));

return rows[0] ?? null;
```

## Cuándo Usar Db Raw En Query

Cada query recibe `{ db }` directo. Si una proyección compleja se repite dentro de
la feature, extraer un helper local con una responsabilidad clara.

## Reglas

- Queries devuelven DTOs/read shapes, no entidades de write-side.
- Queries pueden usar joins, CTEs o raw SQL.
- No mutar estado desde queries.
- No reutilizar repositories de write-side para listados.

## Compartir Reads

Si una proyección se repite en la misma feature, extraer un helper local. Si se
repite entre features, evaluar si es un concepto shared real o si cada feature debe
mantener su propio DTO.
