# Queries: forma y patrones

## Signatura canónica

```ts
type QueryHandler<In, Out> = (
  ctx: ReadContext,
  input: In,
) => Promise<Result<Out, AppError>>;
```

## ReadContext

```ts
type ReadContext = {
  db: Db;
  logger: Logger;
  auth: AuthPrincipal | null;
};
```

Las queries reciben `ctx` (no `deps`). La asimetría es intencional:

| | Commands | Queries |
|---|---|---|
| Recibe | `CommandDeps` con repo, eventBus, clock | `ReadContext` con db raw |
| Persiste | Sí, via repo | No (read-only) |
| Forma del retorno | Agregado o DTO | DTO específico del endpoint |
| Joins cross-aggregate | No (acopla slices) | Sí (es read; sin acoplar código) |

## Patrón típico

```ts
import { eq } from 'drizzle-orm';

export const getXByIdHandler = async (
  ctx: ReadContext,
  { id }: { id: string },
): Promise<Result<XDto, AppError>> => {
  const rows = await ctx.db
    .select({
      id: xs.id,
      name: xs.name,
      // proyección directa a los campos del DTO
    })
    .from(xs)
    .where(eq(xs.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return failure(notFound('X', id));

  return success(row);
};
```

## Joins cross-aggregate (read-side OK)

```ts
const rows = await ctx.db
  .select({
    id: quotes.id,
    total: quotes.total,
    customerName: customers.name,
    customerEmail: customers.email,
  })
  .from(quotes)
  .leftJoin(customers, eq(quotes.customerId, customers.id))
  .where(eq(quotes.id, id));
```

Esto **no** rompe la regla de "no importar features cross". Estás leyendo SQL,
no código de otro feature. La tabla `customers` está en `shared/db/schema.ts`.

Si un join se vuelve recurrente entre múltiples queries, podés extraer una
"vista lógica" en un helper del propio feature.

## Paginación

**Preferí cursor sobre offset.** Offset se vuelve lento con páginas grandes y es
inconsistente cuando hay inserts concurrentes.

```ts
const ListXQuery = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const rows = await ctx.db
  .select(...)
  .from(xs)
  .where(input.cursor ? gt(xs.id, input.cursor) : undefined)
  .orderBy(asc(xs.id))
  .limit(input.limit + 1);  // +1 para detectar siguiente página

const hasMore = rows.length > input.limit;
const items = hasMore ? rows.slice(0, input.limit) : rows;
const nextCursor = hasMore ? items[items.length - 1].id : null;
```

Si el orden no es por ID (ej. por fecha), el cursor debe ser una tupla
`(createdAt, id)` para desempate.

## Filtros opcionales

```ts
const conditions: SQL[] = [];
if (input.status) conditions.push(eq(xs.status, input.status));
if (input.fromDate) conditions.push(gte(xs.createdAt, input.fromDate));

const where = conditions.length > 0 ? and(...conditions) : undefined;

const rows = await ctx.db.select().from(xs).where(where);
```

## Raw SQL cuando hace falta

Drizzle expone `sql` template:

```ts
import { sql } from 'drizzle-orm';

const rows = await ctx.db.execute<XRow>(sql`
  SELECT x.*, COUNT(y.id) AS y_count
  FROM xs x
  LEFT JOIN ys y ON y.x_id = x.id
  WHERE x.status = ${input.status}
  GROUP BY x.id
  ORDER BY x.created_at DESC
`);
```

Para queries complejas (window functions, CTEs, etc.) esto es preferible a
construir con el builder.

## Caching (opcional)

Si una query es costosa y los datos son raramente mutados:

```ts
type CachedReadContext = ReadContext & { cache: Cache };

export const expensiveQueryHandler = async (ctx, input) => {
  const cached = await ctx.cache.get(`xs:${input.id}`);
  if (cached) return success(cached);

  const result = await loadFromDb(ctx, input);
  if (result.ok) await ctx.cache.set(`xs:${input.id}`, result.value, { ttlSec: 60 });
  return result;
};
```

Invalidación: suscribir un handler de `XUpdated` que borre la entrada. Para casos
simples, TTL es suficiente.

## Auth en queries

Si el endpoint requiere autenticación, el middleware ya pone `c.var.auth`. La query
puede usar `ctx.auth` para filtrar:

```ts
const rows = await ctx.db
  .select()
  .from(xs)
  .where(eq(xs.ownerId, ctx.auth!.userId));
```

Si la auth falta y la ruta lo requiere, el middleware `requireAuth` ya cortó antes.
Dentro de la query, podés asumir que está (`ctx.auth!`).

## Anti-patrones

- ❌ Usar el repo desde la query (`createXRepo(ctx.db).findById(...)`). Va directo
  al `ctx.db`.
- ❌ Cargar el agregado completo y mapearlo a DTO en código. Proyectar en SQL.
- ❌ N+1: hacer un select por cada item del listado. Usar joins.
- ❌ Retornar el shape interno de la DB en lugar del DTO público.
- ❌ Mutar dentro de una query (clue: `INSERT`/`UPDATE`/`DELETE` no van acá).
