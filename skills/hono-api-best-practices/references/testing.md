# Testing con bun:test

## Stack

- **bun:test** — built-in, zero config, Jest-compatible API.
- **app.request()** — método de Hono para tests in-memory (no port binding).
- **pglite** o **testcontainers** para DB efímera en integration tests.

## Unidad: handlers con deps mockeadas

Los handlers son funciones puras async. Mockear es construir el record `deps`:

```ts
import { describe, test, expect, mock } from 'bun:test';
import { createExampleHandler } from './commands/create-example';

describe('createExampleHandler', () => {
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
    const clock = { now: () => new Date('2026-05-12T00:00:00Z') };

    const result = await createExampleHandler(
      { repo, eventBus, logger: silentLogger, clock, userId: 'u1' },
      { name: 'test' },
    );

    expect(result.ok).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ExampleCreated' }),
    );
  });

  test('retorna NotFound si no existe (en updateHandler)', async () => {
    const repo = {
      findById: mock(async () => null),
      save: mock(async () => {}),
      delete: mock(async () => {}),
    };
    const result = await updateExampleHandler(
      { repo, eventBus: noopBus, logger: silentLogger, clock: fixedClock },
      { id: crypto.randomUUID(), input: { name: 'new' } },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('NotFound');
  });
});
```

## Logger silencioso para tests

```ts
// test/helpers.ts
import pino from 'pino';
export const silentLogger = pino({ level: 'silent' });
```

## Integration: app.request()

```ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { buildApp, systemClock } from '@/app';
import { createEventBus } from '@shared/events/event-bus';
import { silentLogger } from '../helpers';
import { buildTestDb, teardownTestDb } from '../helpers/db';

let app: ReturnType<typeof buildApp>;
let db: Awaited<ReturnType<typeof buildTestDb>>;

beforeAll(async () => {
  db = await buildTestDb();
  app = buildApp({
    db,
    logger: silentLogger,
    eventBus: createEventBus(),
    clock: systemClock,
  });
});

afterAll(async () => {
  await teardownTestDb(db);
});

describe('POST /examples', () => {
  test('201 con input válido', async () => {
    const res = await app.request('/examples', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'hola' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('hola');
  });

  test('422 con body vacío', async () => {
    const res = await app.request('/examples', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });
});

describe('GET /examples/:id', () => {
  test('404 si no existe', async () => {
    const res = await app.request(`/examples/${crypto.randomUUID()}`);
    expect(res.status).toBe(404);
  });
});
```

## DB efímera: pglite

```bash
bun add -D @electric-sql/pglite
```

```ts
// test/helpers/db.ts
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@shared/db/schema';
import { sql } from 'drizzle-orm';

export const buildTestDb = async () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  // ejecutar migrations (o sql raw para test)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS examples (...);
  `);
  return db;
};

export const teardownTestDb = async (db: any) => {
  // PGlite cleanup es automático cuando se garbage-collecta
};
```

pglite es Postgres compilado a WASM. Corre in-process, no necesita Docker. Para
queries simples es más que suficiente.

## DB efímera: testcontainers (alternativa)

```bash
bun add -D testcontainers
```

```ts
import { PostgreSqlContainer } from 'testcontainers';

const container = await new PostgreSqlContainer('postgres:16-alpine').start();
const url = container.getConnectionUri();
const db = buildDb(url);
// ... migraciones
// teardown: await container.stop();
```

Más lento (arranca Docker), pero Postgres real. Útil si pglite no cubre algún feature
de Postgres que usás (extensions, etc.).

## Tests por feature

Tests viven al lado del código:

```
features/quotes/
  commands/create-quote.ts
  commands/create-quote.test.ts        # unit
  queries/list-quotes.ts
  queries/list-quotes.test.ts          # unit
  routes.ts
  routes.test.ts                       # integration
```

Esto sigue la convención de vertical slice — todo el feature en una carpeta.

## Cobertura

```bash
bun test --coverage
```

bun:test reporta cobertura native. No hay que configurar Istanbul.

## Tests de migrations

```ts
test('migrations son idempotentes', async () => {
  const db = await buildTestDb();
  await runMigrations(db);
  await runMigrations(db);  // no debería tirar
});
```

## Time-based tests

Usar `clock` mockeable:

```ts
const fixedClock = { now: () => new Date('2026-05-12T12:00:00Z') };
await handler({ ...deps, clock: fixedClock }, input);
```

Para timers reales (setTimeout dentro del handler), usar `bun:test`'s fake timers:

```ts
import { setSystemTime } from 'bun:test';
beforeEach(() => setSystemTime(new Date('2026-05-12')));
```

## Mocks vs spies vs fakes

| Tool | Cuándo |
|---|---|
| `mock(fn)` | Reemplazar función con stub trackable. |
| `spyOn(obj, 'method')` | Espiar sin reemplazar implementación. |
| Fake records | Para `deps` — construir un objeto con los métodos necesarios. |

Para `deps`, **preferí fake records** sobre `mock.module()` — más explícito, menos
magia, no interfiere entre tests.

## Anti-patrones

- ❌ `mock.module('@shared/db/client')` para mockear DB globalmente. Frágil.
  Pasar `db` como dep al handler.
- ❌ Test data que viola contratos Zod. Si el schema dice `id: z.string().uuid()`,
  no uses `'u1'` en mocks — usa `crypto.randomUUID()`. El test debe validar el
  contrato real, no solo pasar.
- ❌ Tests que comparten estado entre `describe` blocks. Cada test debería ser
  independiente o usar `beforeEach` para reset.
- ❌ Tests que tocan el filesystem real. Usar pglite o mocks.
- ❌ Tests dependientes del orden. Cada test debe pasar aislado.
- ❌ Tests que esperan miles de ms. Si necesitás esperar, usar `await` con un
  helper determinístico.
