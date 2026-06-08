# Outbox Pattern

Outbox da durabilidad a side effects. Guardar un evento en la misma transaccion que
el cambio de dominio y procesarlo luego con un worker.

## Tabla

```ts
export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').primaryKey(),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status', { enum: ['pending', 'processing', 'processed', 'failed'] })
    .notNull()
    .default('pending'),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});
```

## Flow

```txt
Command handler
  -> tx
  -> save aggregate
  -> insert outbox event
  -> commit
  -> worker polls pending events
  -> send email/webhook/etc
  -> mark processed or retry
```

## Worker

El worker debe tener:

- batch size fijo
- concurrencia máxima
- retry con backoff
- `maxAttempts`
- estado final `failed` o dead-letter
- idempotencia en consumers externos
- shutdown graceful

Usar `FOR UPDATE SKIP LOCKED` o mecanismo equivalente para evitar que dos workers
procesen el mismo evento.

## Cuándo Usar

- email
- webhooks
- notifications
- provider sync
- analytics/audit durable
- publish a broker

No usar outbox para cada evento interno trivial si no se necesita durabilidad.

## Anti-Patrones

- enviar email/webhook dentro de la transacción principal
- borrar eventos fallidos sin auditoría
- retry infinito
- payload enorme con datos sensibles
- consumer no idempotente
