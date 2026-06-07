# Testing con bun:test

## Stack

- **bun:test** — built-in, zero config, Jest-compatible API.
- **app.request()** — método de Hono para tests in-memory.
- **pglite** o **testcontainers** para DB efímera en integration tests.

## Unidad: use cases con deps fake

Los use cases son funciones puras async. Mockear es construir el record `deps`:

```ts
import { describe, expect, mock, test } from 'bun:test';
import { createExampleCommand } from './use-cases/commands/create-example.command';

describe('createExampleCommand', () => {
  test('persiste, emite evento y retorna DTO', async () => {
    const repo = {
      findById: mock(async () => null),
      save: mock(async () => {}),
      delete: mock(async () => {}),
    };
    const eventBus = {
      publish: mock(() => {}),
      publishMany: mock(() => {}),
      on: mock(() => {}),
      off: mock(() => {}),
    };
    const tx = { run: (fn: (db: unknown) => unknown) => fn({}) };
    const clock = { now: () => new Date('2026-05-12T00:00:00Z') };

    const result = await createExampleCommand(
      {
        createRepo: () => repo,
        tx,
        eventBus,
        logger: silentLogger,
        clock,
      },
      { name: 'test', actorId: 'u1' },
    );

    expect(result.ok).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publishMany).toHaveBeenCalledTimes(1);
  });
});
```

## Integration: app.request()

```ts
import { describe, expect, test } from 'bun:test';
import { buildApp } from '@/app';
import { createTestContainer } from '@test/helpers';

describe('POST /examples', () => {
  test('201 con input válido', async () => {
    const container = await createTestContainer();
    const app = buildApp(container);

    const res = await app.request('/examples', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'hola' }),
    });

    expect(res.status).toBe(201);
  });
});
```

## DB Efímera: pglite

```ts
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/db/schema';

export const buildTestDb = async () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS examples (...);
  `);

  return { db, close: () => client.close() };
};
```

pglite corre in-process y no necesita Docker. Para features avanzadas de Postgres
que no cubra pglite, usar testcontainers.

## Tests Por Feature

Tests viven al lado del código:

```txt
features/quotes/
  use-cases/
    commands/
      create-quote.command.ts
      create-quote.command.test.ts
    queries/
      list-quotes.query.ts
      list-quotes.query.test.ts
  routes/
    quotes.routes.ts
    quotes.routes.test.ts
```

Esto mantiene toda la feature en una carpeta, con responsabilidades internas claras.

## Cobertura

```bash
bun test --coverage
```

## Time-Based Tests

Usar `clock` mockeable:

```ts
const fixedClock = { now: () => new Date('2026-05-12T12:00:00Z') };
await createExampleCommand({ ...deps, clock: fixedClock }, input);
```

Para timers reales, usar fake timers de `bun:test`.

## Mocks vs Fakes

Preferir fake records explícitos sobre mock global:

- ✅ `createRepo: () => fakeRepo`
- ✅ `readModel: fakeReadModel`
- ❌ `mock.module('@shared/db/client')` para mockear DB globalmente
