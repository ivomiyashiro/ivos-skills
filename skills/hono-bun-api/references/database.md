# Database: Drizzle vs Kysely vs Bun.sql

Este skill es **agnóstico** sobre la capa de DB. El `_example/` usa Drizzle + postgres.js
porque es el más completo en TS, pero las tres opciones son válidas. Elegí según tu
tolerancia a abstracción.

## Comparación

| Aspecto | Drizzle | Kysely | Bun.sql |
|---|---|---|---|
| Schema-as-code | Sí (TS) | Opcional (DTS gen) | No (tipos manuales) |
| Migrations | drizzle-kit | kysely-codegen, otros | DIY |
| Query builder | Sí | Sí (más SQL-honest) | No (template literals) |
| Raw SQL escape | `sql\`...\`` | `sql\`...\`` | Default |
| Codegen necesario | No | Sí (para tipos de tablas) | No |
| Performance Bun | Excelente | Excelente | Mejor (driver nativo) |

## Drizzle + postgres.js (default del _example/)

```bash
bun add drizzle-orm postgres
bun add -D drizzle-kit
```

### Schema

```ts
// shared/db/schema.ts
import { pgTable, uuid, text, timestamp, numeric } from 'drizzle-orm/pg-core';

export const examples = pgTable('examples', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: text('status', { enum: ['draft', 'active', 'archived'] }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ExampleRow = typeof examples.$inferSelect;
export type ExampleInsert = typeof examples.$inferInsert;
```

### Cliente

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const buildDb = (url: string) =>
  drizzle(postgres(url, { max: 20 }), { schema });

export type Db = ReturnType<typeof buildDb>;
```

### Write (repo)

```ts
await db.insert(examples).values(entity);
// upsert
await db.insert(examples).values(entity).onConflictDoUpdate({
  target: examples.id,
  set: entity,
});
// update
await db.update(examples).set({ status: 'active' }).where(eq(examples.id, id));
// delete
await db.delete(examples).where(eq(examples.id, id));
```

### Read (query handler)

```ts
const rows = await ctx.db
  .select({ id: examples.id, name: examples.name })
  .from(examples)
  .leftJoin(customers, eq(examples.customerId, customers.id))
  .where(and(eq(examples.status, 'active'), gt(examples.createdAt, since)))
  .orderBy(desc(examples.createdAt))
  .limit(20);
```

### Raw SQL

```ts
import { sql } from 'drizzle-orm';

const rows = await db.execute<ExampleRow>(sql`
  SELECT * FROM examples WHERE complex_condition()
`);
```

### Transacciones

```ts
await db.transaction(async (tx) => {
  await tx.insert(...).values(...);
  await tx.update(...).set(...);
});
```

### Migrations

```bash
bun run db:generate    # genera SQL desde el schema
bun run db:migrate     # aplica al DB
bun run db:studio      # UI para inspeccionar
```

`drizzle.config.ts`:

```ts
export default defineConfig({
  schema: './src/shared/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: Bun.env.DATABASE_URL },
});
```

**Pros:** typed end-to-end, sin codegen, escape hatch a raw SQL, soporta Bun.sql como driver alterno.
**Cons:** API tiene su curva (joinear, on conflict syntax).

## Kysely

```bash
bun add kysely pg
bun add -D kysely-codegen
```

### Tipos (manuales o codegen)

```ts
import type { Generated } from 'kysely';

interface Database {
  examples: {
    id: Generated<string>;
    name: string;
    status: 'draft' | 'active' | 'archived';
    total: number;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };
}
```

### Cliente

```ts
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

export const buildDb = (url: string) =>
  new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString: url, max: 20 }),
    }),
  });

export type Db = Kysely<Database>;
```

### Write

```ts
await db.insertInto('examples').values({ id, name, status, total }).execute();
await db
  .updateTable('examples')
  .set({ status: 'active' })
  .where('id', '=', id)
  .execute();
```

### Read

```ts
const rows = await db
  .selectFrom('examples')
  .innerJoin('customers', 'customers.id', 'examples.customer_id')
  .select(['examples.id', 'customers.name as customer'])
  .where('examples.status', '=', 'active')
  .execute();
```

### Raw SQL

```ts
import { sql } from 'kysely';
const rows = await sql<ExampleRow>`SELECT * FROM examples`.execute(db);
```

### Transacciones

```ts
await db.transaction().execute(async (tx) => {
  await tx.insertInto('examples').values(...).execute();
});
```

### Migrations

Kysely no provee schema codegen propio. Opciones:
- Atlas + `kysely-codegen` para regenerar tipos desde DB.
- node-pg-migrate o similar para SQL puro.

**Pros:** API muy SQL-like, sin schema-as-code obligatorio, tipos generables desde DB existente.
**Cons:** codegen step si querés tipos auto.

## Bun.sql nativo (sin ORM)

```ts
import { sql } from 'bun';
// Bun.sql viene built-in con Bun ≥ 1.2
```

Setup:

```ts
// shared/db/client.ts
import { SQL } from 'bun';

export const buildDb = (url: string) => new SQL(url);
export type Db = SQL;
```

### Write

```ts
await db`INSERT INTO examples ${db({ id, name, status, total })}`;
await db`UPDATE examples SET status = ${'active'} WHERE id = ${id}`;
await db`DELETE FROM examples WHERE id = ${id}`;
```

### Read

```ts
const [row] = await db<ExampleRow[]>`
  SELECT e.*, c.name AS customer_name
  FROM examples e
  LEFT JOIN customers c ON c.id = e.customer_id
  WHERE e.id = ${id}
`;
```

### Transacciones

```ts
await db.begin(async (tx) => {
  await tx`INSERT INTO examples ${tx({ id, name })}`;
});
```

### Migrations

DIY. Carpeta `migrations/0001_create_examples.sql`, script que las ejecuta en orden
contra una tabla `schema_migrations`.

**Pros:** velocidad nativa Bun, cero abstracción, sin deps.
**Cons:** tipos manuales, sin schema-as-code, migraciones DIY.

## Recomendación

| Si querés... | Usar |
|---|---|
| Type-safety completa + migrations | **Drizzle** |
| SQL-first, sin schema-as-code | **Kysely** |
| Mínima dep surface, performance pura | **Bun.sql** |

El skill default es Drizzle. Para swap a Kysely o Bun.sql:
1. Editar `src/shared/db/client.ts` con el cliente nuevo.
2. Cambiar `Db` type.
3. Adaptar repositories/read models de cada feature.
4. Las queries del lado read se reescriben similar.

## Pool sizing

Default 20 conexiones. Para tuning:
- Pool size ≈ `cores * 2 + effective_spindle_count` (regla vieja).
- En Postgres, ojo con `max_connections` (default 100). Si tu app tiene
  10 réplicas con pool 20, son 200 conexiones — saturás.

## Anti-patrones

- ❌ Mezclar dos clientes (ej. drizzle + sequelize). Elegí uno y stick.
- ❌ Crear el pool en cada request. Build-once en boot.
- ❌ Olvidar cerrar el pool en shutdown. Causa connections leaking.
- ❌ Hardcodear `DATABASE_URL`. Va por env.
