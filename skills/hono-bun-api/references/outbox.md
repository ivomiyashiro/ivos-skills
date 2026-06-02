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

## Cuándo Usar

- email
- webhooks
- notifications
- provider sync
- analytics/audit durable
- publish a broker

No usar outbox para cada evento interno trivial si no se necesita durabilidad.
