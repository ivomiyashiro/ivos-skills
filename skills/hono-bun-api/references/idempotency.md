# Idempotencia

Usar idempotencia cuando una operación puede repetirse por retries, doble click,
mobile clients, webhooks o fallas de red. Es obligatoria para pagos, webhooks,
invitaciones y creates sensibles.

## Regla

```txt
Misma key + mismo actor/tenant + mismo payload -> devolver mismo resultado.
Misma key + payload distinto -> Conflict.
Sin key en command sensible -> Validation/Bad Request.
```

## Tabla Recomendada

```ts
export const idempotencyKeys = pgTable('idempotency_keys', {
  key: text('key').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  actorId: uuid('actor_id'),
  requestHash: text('request_hash').notNull(),
  status: text('status', { enum: ['processing', 'completed', 'failed'] }).notNull(),
  response: jsonb('response'),
  resourceType: text('resource_type'),
  resourceId: uuid('resource_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.tenantId, t.key] }),
}));
```

## Flow

```txt
controller lee Idempotency-Key
  -> command recibe idempotencyKey
  -> tx intenta reservar key
  -> si completed con mismo hash, devuelve resultado guardado
  -> si processing, devuelve Conflict o retry-after
  -> ejecuta write
  -> guarda resultado/recurso creado
  -> commit
```

## Hash De Payload

Hash estable del payload relevante, no del body raw completo. Excluir headers
volátiles. Incluir tenant/actor cuando afecten permisos o resultado.

## Webhooks

Para webhooks, usar el event id del proveedor como idempotency key:

- Stripe: `event.id`
- GitHub: delivery id
- Supabase/otros: id del evento si existe

Validar firma antes de reservar la key.

## Anti-Patrones

- guardar key fuera de la misma transacción que el write
- usar solo timestamp para detectar duplicados
- devolver éxito para misma key con payload distinto
- hacer retry de pagos sin idempotency key
