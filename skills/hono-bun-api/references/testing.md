# Testing con bun:test

## Stack

- **bun:test** — built-in, zero config, Jest-compatible API.
- **app.request()** — método de Hono para tests in-memory.
- **Docker Compose Postgres** para integration tests de HTTP y DB.

## Unidad: Solo Lógica Pura

Testear solo parsers, cálculos y helpers puros junto a la operación que
los posee. Commands y queries con IO se cubren con integration contra Postgres real.

```ts
import { describe, expect, test } from 'bun:test';
import { normalizeExampleName } from './create-example.command';

describe('normalizeExampleName', () => {
  test('trims and collapses internal whitespace', () => {
    expect(normalizeExampleName('  example   name  ')).toBe('example name');
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
    const dependencies = await createTestContainer();
    const app = buildApp(dependencies);

    const res = await app.request('/examples', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'hola' }),
    });

    expect(res.status).toBe(201);
  });
});
```

## Postgres Real: Docker Compose

```bash
docker compose -f docker-compose.test.yml up -d --wait
bun run db:migrate
bun run db:seed
bun run test:integration
docker compose -f docker-compose.test.yml down -v
```

Configurar `bunfig.toml` para preload de las variables de test antes de cargar la
configuración de la app. La base se prepara con las migraciones y seed reales.

## Tests Por Feature

Los tests puros viven junto al código. Todos los tests HTTP y DB viven en
`features/<feature>/__tests__/`:

```txt
features/quotes/
  use-cases/
    commands/
      create-quote.command.ts
      create-quote.command.test.ts
    queries/
      list-quotes.query.ts
  __tests__/
    quotes.integration.ts
```

No mockear database ni Supabase en estos tests. Ejercitar la app con `app.request()`
y el composition root real contra Postgres.

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

## Límites De Mocks

- No mockear database ni Supabase en integration HTTP/DB.
- Usar doubles solo cuando un helper puro necesita una dependencia externa aislada.
- No usar `mock.module('@shared/db/client')` como default.
