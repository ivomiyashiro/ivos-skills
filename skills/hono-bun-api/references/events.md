# Domain Events in-process

## Modelo

```ts
// shared/events/event-bus.ts
export type DomainEvent<TType extends string = string, TPayload = unknown> = {
  type: TType;
  payload: TPayload;
  occurredAt: Date;
};

export const createEventBus = () => {
  const emitter = new EventEmitter();
  return {
    publish: (event: DomainEvent) => emitter.emit(event.type, event),
    publishMany: (events: DomainEvent[]) => {
      for (const e of events) emitter.emit(e.type, e);
    },
    on: <E extends DomainEvent>(type: E['type'], handler: (e: E) => void | Promise<void>) =>
      emitter.on(type, handler as any),
    off: ...
  };
};
```

Wrap de `EventEmitter`. **In-process** — no atraviesa réplicas, no es durable.

## Definir eventos del feature

```ts
// features/quotes/events.ts
import type { DomainEvent } from '@shared/events/event-bus';

export type QuoteCreated = DomainEvent<
  'QuoteCreated',
  { id: string; customerId: string; total: number }
>;

export type QuoteCancelled = DomainEvent<
  'QuoteCancelled',
  { id: string; reason: string }
>;

export type QuoteEvent = QuoteCreated | QuoteCancelled;
```

## Emitir desde un command

```ts
// commands/create-quote.ts
import type { QuoteCreated } from '../events';

export const createQuoteHandler = async (deps, input) => {
  const id = crypto.randomUUID();
  await deps.repo.save({ id, /* ... */ });

  const event: QuoteCreated = {
    type: 'QuoteCreated',
    payload: { id, customerId: input.customerId, total: input.total },
    occurredAt: deps.clock.now(),
  };
  deps.eventBus.publish(event);

  return success(toDto(...));
};
```

## Patrón: pending events + flush post-commit

Si el command tiene transacción, NO publicar dentro de la tx (si la tx hace rollback,
el evento ya se fue). Acumular y emitir después:

```ts
export const transferHandler = async (deps, input) => {
  const pendingEvents: DomainEvent[] = [];

  await withTransaction(deps.db, async (tx) => {
    const repo = createQuotesRepo(tx);
    await repo.save(updatedFrom);
    await repo.save(updatedTo);
    pendingEvents.push({ type: 'QuoteTransferred', payload: { from, to }, occurredAt });
  });

  // Solo después del commit exitoso
  deps.eventBus.publishMany(pendingEvents);

  return success(...);
};
```

## Suscribir handlers en boot

```ts
// server.ts (o un módulo separado)
import { createEventBus } from '@shared/events/event-bus';
import { sendQuoteEmailOnCreated } from '@features/notifications/handlers';

const eventBus = createEventBus();

eventBus.on<QuoteCreated>('QuoteCreated', async (event) => {
  await sendQuoteEmailOnCreated(event.payload);
});

eventBus.on<QuoteCancelled>('QuoteCancelled', async (event) => {
  logger.info({ event }, 'quote cancelled');
});
```

Los suscriptores corren **dentro del mismo proceso**. Si tirran, el flujo del comando
sigue (publish es fire-and-forget en EventEmitter).

## Error handling en suscriptores

EventEmitter no atrapa errores async. Wrap:

```ts
eventBus.on('QuoteCreated', async (event) => {
  try {
    await sendEmail(event);
  } catch (err) {
    logger.error({ err, event }, 'event handler failed');
    // opcional: outbox de retry, dead letter
  }
});
```

## Limitaciones del bus in-process

| Limitación | Implicancia |
|---|---|
| No durable | Si el proceso crashea entre publish y handler, el evento se pierde. |
| No cross-replica | El handler de "send email" en réplica A no recibe events de réplica B. |
| Sin retry | Si el handler falla, no se reintenta solo. |

Para casos donde estos importan, evolucionar a **outbox pattern** (siguiente sección).

## Outbox pattern (cuando hace falta durabilidad)

```ts
// shared/events/outbox.ts
type OutboxEntry = {
  id: string;
  type: string;
  payload: unknown;
  occurredAt: Date;
  processedAt: Date | null;
};

// Dentro de la misma tx que el cambio de dominio:
await tx.insert(outboxEntries).values({
  id: crypto.randomUUID(),
  type: 'QuoteCreated',
  payload: { id, customerId },
  occurredAt: now,
  processedAt: null,
});
```

Un worker separado (proceso o cron) lee `outbox WHERE processed_at IS NULL ORDER BY occurredAt`,
los procesa (incluyendo publish a un broker externo), y los marca como procesados.

**Pros:** durabilidad atómica con el cambio de dominio, retry trivial.
**Cons:** complejidad operacional, latencia mayor.

Cuándo migrar a outbox:
- Necesitás que un evento llegue a un sistema externo (mail, broker).
- Necesitás replay para reconstrucción de proyecciones.
- Reliability > latencia.

## Tipado fuerte de suscriptores

Si querés que `eventBus.on('QuoteCreated', handler)` infiera el shape del payload:

```ts
declare module '@shared/events/event-bus' {
  interface EventMap {
    QuoteCreated: QuoteCreated;
    QuoteCancelled: QuoteCancelled;
  }
}
```

Y declarar `EventMap` en el bus con TS generics. Es opcional — el patrón sin esto
funciona con cast explícito.

## Anti-patrones

- ❌ Publicar antes de persistir. Si la persistencia falla, el evento ya se fue.
- ❌ Publicar dentro de la tx. Si la tx hace rollback, el evento sale igual.
- ❌ Dependencias circulares: feature A suscribe a B, B suscribe a A. Repensar
  el flujo.
- ❌ Eventos con payloads enormes (objetos completos). Que el payload tenga solo
  IDs y datos esenciales; el suscriptor lee lo que necesita.
- ❌ Confiar en orden de suscriptores. EventEmitter ejecuta en orden de registro,
  pero no debería ser relevante.
