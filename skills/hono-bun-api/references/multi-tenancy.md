# Multi-Tenancy

Si el producto puede crecer a organizaciones, equipos o clientes separados, disenar
multi-tenancy desde el inicio.

## Columnas Base

Tablas principales:
- `organization_id` o `tenant_id`
- `created_at`
- `updated_at`
- `deleted_at` si hay soft delete

## Regla De Query

Toda query de recurso tenant-scoped debe filtrar por tenant:

```ts
where(
  and(
    eq(projects.organizationId, organizationId),
    eq(projects.id, projectId),
  ),
)
```

Nunca buscar solo por `id` si el endpoint depende de una organizacion.

## Indices Comunes

- `(organization_id, created_at desc)`
- `(organization_id, status, created_at desc)`
- `(organization_id, id)`
- `(user_id, organization_id)`

## AuthZ

AuthN responde "quien sos". AuthZ responde "que podes hacer en este tenant".
Validar membresia/rol/plan en application/domain, no solo con RLS.
