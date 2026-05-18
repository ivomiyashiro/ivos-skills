# Commands: forma y patrones

## Signatura canónica

```ts
type CommandHandler<In, Out> = (
  deps: CommandDeps,
  input: In,
) => Promise<Result<Out, AppError>>;
```

Toda mutación del estado pasa por un command handler con esta forma.

## CommandDeps

```ts
type CommandDeps = {
  repo: XRepo;              // Específico del feature
  eventBus: EventBus;       // Para domain events
  logger: Logger;           // Child logger por request
  clock: Clock;             // { now(): Date } — abstracción para tests
  userId: string | null;    // Del principal autenticado
};
```

**Por qué Clock:** evita `new Date()` directo, que hace los tests no determinísticos.
En prod se inyecta `systemClock`; en tests, un `fakeClock = { now: () => fixedDate }`.

## Patrón típico

```ts
export const createXHandler = async (
  deps: CreateXDeps,
  input: CreateXInput,
): Promise<Result<XDto, AppError>> => {
  // 1) Validaciones de dominio (más allá de Zod)
  if (input.amount > MAX_LIMIT) {
    return failure({ kind: 'Validation', issues: [{ path: 'amount', message: 'over limit' }] });
  }

  // 2) Cargar agregados afectados (solo si necesitás mutar uno existente)
  // const existing = await deps.repo.findById(input.id);
  // if (!existing) return failure(notFound('X', input.id));

  // 3) Aplicar la mutación (puro, sin I/O)
  const entity = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: deps.clock.now(),
  };

  // 4) Persistir
  await deps.repo.save(entity);

  // 5) Emitir eventos (después de persistir)
  deps.eventBus.publish({
    type: 'XCreated',
    payload: { id: entity.id },
    occurredAt: deps.clock.now(),
  });

  deps.logger.info({ id: entity.id }, 'X created');

  // 6) Retornar DTO
  return success(toDto(entity));
};
```

## Transacciones

Si el command necesita atomicidad sobre múltiples writes:

```ts
import { withTransaction } from '@shared/db/transaction';
import { createXRepo } from '../repository';

export const transferHandler = async (deps, input) =>
  withTransaction(deps.db, async (tx) => {
    const repo = createXRepo(tx);  // repo creado SOBRE la tx
    // ... múltiples save() dentro de la misma tx
    // si tira, rollback automático
    return success(result);
  });
```

El handler recibe `db: Db` en `deps` solo si necesita transacciones. Para casos
simples, `repo` ya cierra sobre el `db` global.

## Eventos: cuándo emitir

- **Después** de persistir, no antes.
- Si hay transacción: acumular eventos en una lista local, persistir, commitear, y
  emitir solo si el commit fue exitoso.

```ts
const pendingEvents: DomainEvent[] = [];

await withTransaction(deps.db, async (tx) => {
  const repo = createXRepo(tx);
  await repo.save(entity);
  pendingEvents.push({ type: 'XCreated', payload: { id }, occurredAt });
});

// Tx commiteada — ahora sí emitimos
deps.eventBus.publishMany(pendingEvents);
```

Para eventos durables (cross-process), evolucionar a outbox table — guardar el evento
en la misma tx y un worker separado lo despacha. Ver `references/events.md`.

## Errores típicos retornados

| AppError kind | Cuándo |
|---|---|
| `Validation` | Input pasó Zod pero falla regla de dominio (ej. monto > límite). |
| `NotFound` | El agregado a mutar no existe. |
| `Conflict` | Estado inválido para la operación (ej. cancelar algo ya cancelado). |
| `Unauthorized` / `Forbidden` | Si el handler hace una decisión de auth fina más allá del middleware. |

`Unknown` lo deja el `app.onError` cuando hay un throw inesperado.

## Idempotencia

Si el cliente puede reintentar, agregar un `idempotencyKey` opcional al input:

```ts
const CreateXInput = z.object({
  // ...
  idempotencyKey: z.string().uuid().optional(),
});
```

El repo puede `findByIdempotencyKey` antes de crear; si existe, retornar el resultado
previo en lugar de crear duplicado.

## Tests

Unit test sin Hono:

```ts
test('create X persiste y emite evento', async () => {
  const repo = { save: mock(async () => {}), findById: mock(async () => null), delete: mock(async () => {}) };
  const eventBus = { publish: mock(() => {}), publishMany: mock(() => {}), on: mock(() => {}), off: mock(() => {}) };
  const clock = { now: () => new Date('2026-05-12T00:00:00Z') };

  const result = await createXHandler(
    { repo, eventBus, logger: silentLogger, clock, userId: 'u1' },
    { name: 'foo', total: 10 },
  );

  expect(result.ok).toBe(true);
  expect(repo.save).toHaveBeenCalledTimes(1);
  expect(eventBus.publish).toHaveBeenCalledTimes(1);
});
```

## Anti-patrones

- ❌ `throw` para business errors. Usar `failure()`.
- ❌ Persistir y emitir evento dentro de la misma operación atómica sin tx
  (el evento puede irse aunque la persistencia falle).
- ❌ Cargar agregados que no vas a mutar (eso es una query).
- ❌ Llamar otros command handlers desde un command (acopla slices). Usar eventos.
