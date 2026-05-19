# Feature walkthrough: crear un slice completo

Esta es la guía paso-a-paso para crear un feature nuevo. Cada paso linkea a la
referencia profunda del concepto. Si querés el patrón mínimo, copiá el feature
`_example/` del skeleton.

## Resumen de los 6 pasos

1. Schemas Zod en `schemas.ts` ([validation](validation.md))
2. Repository write-only en `repository.ts` ([repositories](repositories.md))
3. Command/Query handlers con Result ([commands](commands.md), [queries](queries.md))
4. Read context en `read-context.ts` ([read-context](read-context.md))
5. Routes con OpenAPI + `toHttpResponse` ([routing](routing.md), [openapi](openapi.md), [errors](errors.md))
6. Tests ([testing](testing.md))

---

## Paso 1 — Schemas Zod

```ts
// features/quotes/schemas.ts
import { z } from '@hono/zod-openapi';

export const QuoteDto = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  total: z.number(),
  status: z.enum(['draft', 'sent', 'accepted']),
}).openapi('QuoteDto');

export const CreateQuoteInput = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    sku: z.string(),
    qty: z.number().int().positive(),
  })).min(1),
}).openapi('CreateQuoteInput');

export type CreateQuoteInput = z.infer<typeof CreateQuoteInput>;
```

## Paso 2 — Repository write-only

```ts
// features/quotes/repository.ts
import type { Db } from '@shared/db/client';
import { quotes } from '@shared/db/schema';
import { eq } from 'drizzle-orm';

export type QuotesRepo = ReturnType<typeof createQuotesRepo>;

export const createQuotesRepo = (db: Db) => ({
  findById: async (id: string) =>
    db.select().from(quotes).where(eq(quotes.id, id)).then(r => r[0] ?? null),
  save: async (q: typeof quotes.$inferInsert) => {
    await db.insert(quotes).values(q).onConflictDoUpdate({
      target: quotes.id, set: q,
    });
  },
  delete: async (id: string) => {
    await db.delete(quotes).where(eq(quotes.id, id));
  },
});
```

## Paso 3 — Command y Query handlers

```ts
// features/quotes/commands/create-quote.ts
import { success, type Result } from '@shared/result';
import type { AppError } from '@shared/errors/app-error';

export type CreateQuoteDeps = {
  repo: QuotesRepo;
  eventBus: EventBus;
  logger: Logger;
  clock: Clock;
  userId: string | null;
};

export const createQuoteHandler = async (
  deps: CreateQuoteDeps,
  input: CreateQuoteInput,
): Promise<Result<QuoteDto, AppError>> => {
  const id = crypto.randomUUID();
  const quote = { id, customerId: input.customerId, total: 0, status: 'draft' as const };
  await deps.repo.save(quote);
  deps.eventBus.publish({
    type: 'QuoteCreated',
    payload: { id },
    occurredAt: deps.clock.now(),
  });
  return success(quote);
};
```

```ts
// features/quotes/queries/get-quote-by-id.ts
import { success, failure, type Result } from '@shared/result';
import { notFound, type AppError } from '@shared/errors/app-error';
import { eq } from 'drizzle-orm';
import { quotes } from '@shared/db/schema';
import type { ReadContext } from '@shared/hono/types';

export const getQuoteByIdHandler = async (
  ctx: ReadContext,
  { id }: { id: string },
): Promise<Result<QuoteDto, AppError>> => {
  const row = await ctx.db.select().from(quotes).where(eq(quotes.id, id)).then(r => r[0]);
  if (!row) return failure(notFound('Quote', id));
  return success(row);
};
```

## Paso 4 — Read context

```ts
// features/quotes/read-context.ts
import type { Context } from 'hono';
import type { AppEnv, ReadContext } from '@shared/hono/types';

export type QuotesReadContext = ReadContext;

export const buildQuotesReadContext = (c: Context<AppEnv>): QuotesReadContext => ({
  db: c.get('db'),
  logger: c.get('logger'),
  auth: c.get('auth'),
});
```

## Paso 5 — Routes con OpenAPI + Result → HTTP

```ts
// features/quotes/routes.ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { toHttpResponse } from '@shared/errors/to-http';
import type { AppDeps } from '@/app';

export const buildQuotesRoutes = (deps: AppDeps) => {
  const r = new OpenAPIHono<AppEnv>();

  r.openapi(
    createRoute({
      method: 'post',
      path: '/',
      request: { body: { content: { 'application/json': { schema: CreateQuoteInput } } } },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: QuoteDto } } },
        422: { description: 'Validation error' },
      },
    }),
    async (c) => {
      const result = await createQuoteHandler(
        {
          repo: createQuotesRepo(c.get('db')),
          eventBus: deps.eventBus,
          logger: c.get('logger'),
          clock: deps.clock,
          userId: c.get('auth')?.userId ?? null,
        },
        c.req.valid('json'),
      );
      return toHttpResponse(c, result, 201);
    },
  );

  return r;
};
```

Después mountealo en `src/app.ts`:

```ts
app.route('/quotes', buildQuotesRoutes(deps));
```

## Paso 6 — Tests

```ts
// features/quotes/routes.test.ts
import { describe, test, expect } from 'bun:test';
import { buildApp } from '@/app';

describe('POST /quotes', () => {
  test('201 con input válido', async () => {
    const app = buildApp(testDeps);
    const res = await app.request('/quotes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customerId: crypto.randomUUID(),
        items: [{ sku: 'A', qty: 1 }],
      }),
    });
    expect(res.status).toBe(201);
  });
});
```

Para el setup de DB efímera (pglite o testcontainers) ver [testing](testing.md).

---

## Snippets canónicos (formas de tipo)

Estos snippets son los contratos que todos los features deben respetar. El código
real vive en `shared/`; acá quedan para consulta rápida.

### Result<T, E>

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const success = <T>(value: T) => ({ ok: true, value });
const failure = <E>(error: E) => ({ ok: false, error });
```

### AppError tagged union

```ts
type AppError =
  | { kind: 'NotFound'; resource: string; id: string }
  | { kind: 'Unauthorized'; reason?: string }
  | { kind: 'Forbidden'; reason?: string }
  | { kind: 'Validation'; issues: { path: string; message: string }[] }
  | { kind: 'Conflict'; reason: string }
  | { kind: 'Unknown'; cause?: unknown };
```

### Shape de command handler

```ts
type CommandHandler<In, Out> = (
  deps: CommandDeps,
  input: In,
) => Promise<Result<Out, AppError>>;
```

### Shape de query handler

```ts
type QueryHandler<In, Out> = (
  ctx: ReadContext,
  input: In,
) => Promise<Result<Out, AppError>>;
```

### Repository factory

```ts
const createXRepo = (db: Db) => ({
  findById: async (id: string) => /* ... */,
  save: async (entity) => /* ... */,
  delete: async (id: string) => /* ... */,
});
```
