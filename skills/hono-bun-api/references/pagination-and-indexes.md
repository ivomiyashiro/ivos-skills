# Paginacion E Indices

Para listados grandes, preferir cursor pagination. Offset se degrada y puede producir
resultados inconsistentes con inserts concurrentes.

## Cursor

Usar campo de orden + `id` como desempate:
- `(createdAt, id)`
- `(updatedAt, id)`
- `(score, id)`

## Indices

Disenar indices desde los endpoints:
- filtros
- orden
- tenant
- soft delete

Ejemplos:

```sql
CREATE INDEX projects_org_created_idx
ON projects (organization_id, created_at DESC, id DESC);

CREATE INDEX projects_org_status_created_idx
ON projects (organization_id, status, created_at DESC, id DESC);
```

## Anti-Patrones

- `limit/offset` en tablas grandes
- ordenar por columna sin indice compatible
- filtrar tenant despues en memoria
- paginar sin desempate estable
