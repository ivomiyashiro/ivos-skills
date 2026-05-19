# Validation con Zod

## Principios

1. **Zod en TODO borde HTTP** (json, query, param).
2. **Schemas co-localizados** con el feature (`schemas.ts`).
3. **El mismo schema** valida y genera OpenAPI.
4. **`z.infer<typeof Schema>`** para el tipo TS — nunca duplicar.

## Setup

```ts
import { z } from '@hono/zod-openapi';
// NO usar `from 'zod'` — el wrapper de @hono/zod-openapi expone .openapi()
```

## Schemas con metadata OpenAPI

```ts
export const XDto = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    status: z.enum(['draft', 'active', 'archived']),
  })
  .openapi('XDto');  // ← nombre del schema en OpenAPI

export type XDto = z.infer<typeof XDto>;
```

El nombre en `.openapi('XDto')` permite que la spec referencie el componente
(`#/components/schemas/XDto`) en lugar de inlinear el schema cada vez.

## Path params

```ts
export const XIdParam = z.object({
  id: z.string().uuid().openapi({
    param: { name: 'id', in: 'path' },
  }),
}).openapi('XIdParam');
```

`.openapi({ param: { name, in } })` le dice al generador que es un parámetro
de path.

## Query params

```ts
export const ListXQuery = z.object({
  status: z.enum(['draft', 'active']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
}).openapi('ListXQuery');
```

Notar `z.coerce.number()` — los query params son strings; coerce los convierte
a número con validación.

## En la ruta

```ts
r.openapi(
  createRoute({
    method: 'post',
    path: '/{id}',
    request: {
      params: XIdParam,
      query: SomeQuery,
      body: { content: { 'application/json': { schema: CreateXInput } } },
    },
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: XDto } } },
      422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const query = c.req.valid('query');
    const body = c.req.valid('json');
    // ...
  },
);
```

`c.req.valid('json')` / `'query'` / `'param'` retorna el tipo inferido del schema.
TypeScript bloquea si pedís un target no declarado en `request`.

## Si NO usás OpenAPI (plain Hono)

```ts
import { zValidator } from '@hono/zod-validator';

app.post('/x', zValidator('json', CreateXInput), async (c) => {
  const body = c.req.valid('json');
  // ...
});
```

Para mezclar varios:

```ts
app.put(
  '/x/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', UpdateXInput),
  async (c) => { /* ... */ },
);
```

## Discriminated unions

```ts
const EventPayload = z.discriminatedUnion('type', [
  z.object({ type: z.literal('created'), data: z.object({ id: z.string() }) }),
  z.object({ type: z.literal('updated'), data: z.object({ id: z.string(), changes: z.record(z.unknown()) }) }),
]);
```

Útil para webhooks, eventos, payloads polimórficos. Zod garantiza que `data` matchea
según `type` y TypeScript narrowa correctamente.

## Refinements

Para validaciones que no entran en el shape básico:

```ts
const DateRange = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
}).refine(({ from, to }) => new Date(from) <= new Date(to), {
  message: 'from must be <= to',
  path: ['from'],
});
```

## Custom errors

Si querés mapear errores de Zod a tu shape:

```ts
const parsed = Schema.safeParse(input);
if (!parsed.success) {
  return failure({
    kind: 'Validation',
    issues: parsed.error.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
    })),
  });
}
```

(En general no necesitás esto — `zValidator` / `OpenAPIHono` ya retornan 400/422
automáticamente con un body razonable.)

## Schemas reutilizables

```ts
// shared/zod/common.ts
export const Uuid = z.string().uuid();
export const IsoDate = z.string().datetime();
export const Cursor = z.string().uuid().optional();
export const Limit = z.coerce.number().int().min(1).max(100).default(20);
```

Y en cada feature:

```ts
import { Uuid, Limit } from '@shared/zod/common';
const ListXQuery = z.object({ status: ..., limit: Limit });
```

## Tipos transform

Si el input difiere del output del schema:

```ts
const PositiveInt = z.coerce.number().int().positive();
// input: "42" (string) → output: 42 (number)

type Input = z.input<typeof PositiveInt>;   // string | number
type Output = z.infer<typeof PositiveInt>;  // number (= z.output)
```

Para handlers, usar siempre `z.infer` (= output).

## Anti-patrones

- ❌ Validar a mano con `if (!body.name) return c.json(...)`. Usar Zod.
- ❌ Duplicar el tipo TS: `interface XDto { id: string }` y `const XDto = z.object(...)`.
  Usar solo Zod y `z.infer`.
- ❌ Schema sin `.openapi(name)` cuando se exporta en una ruta OpenAPI — la spec
  inlinea el schema y se pierde la reusabilidad.
- ❌ Throw `ZodError` dentro del handler. Eso ya lo maneja Hono.
