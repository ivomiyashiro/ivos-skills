# Paginacion E Indices

Para listados grandes, preferir cursor pagination. Offset se degrada y puede producir
resultados inconsistentes con inserts concurrentes.

## Cursor

Usar campo de orden + `id` como desempate:
- `(createdAt, id)`
- `(updatedAt, id)`
- `(score, id)`

## Índices Por Query

Diseñar índices desde los endpoints:
- filtros
- orden
- tenant
- soft delete

Primero escribir la forma de la query:

```txt
where organization_id = ?
  and status = ?
order by created_at desc, id desc
limit ?
```

Después diseñar el índice:

```txt
(organization_id, status, created_at desc, id desc)
```

Ejemplos:

```sql
CREATE INDEX projects_org_created_idx
ON projects (organization_id, created_at DESC, id DESC);

CREATE INDEX projects_org_status_created_idx
ON projects (organization_id, status, created_at DESC, id DESC);
```

Reglas:

- Columnas de igualdad primero: `organization_id`, `status`, `owner_id`.
- Columnas de rango después: `created_at`, `score`, `amount`.
- Orden al final, con dirección compatible.
- Agregar `id` como desempate estable.
- No crear índices "por si acaso"; cada índice debe responder a una query real.

## Anti-Patrones

- `limit/offset` en tablas grandes
- ordenar por columna sin indice compatible
- filtrar tenant despues en memoria
- paginar sin desempate estable
