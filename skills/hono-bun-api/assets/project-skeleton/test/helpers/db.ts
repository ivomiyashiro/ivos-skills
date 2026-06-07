import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/db/schema';
import type { Db } from '@shared/db/client';

/**
 * buildTestDb — arranca pglite (Postgres compilado a WASM, in-process), aplica
 * el schema de la feature examples y retorna { db, close }.
 *
 * El cast `as unknown as Db` es seguro mientras los handlers usen solo APIs
 * compatibles entre `drizzle-orm/postgres-js` y `drizzle-orm/pglite`
 * (select/insert/update/delete + onConflictDoUpdate). Ambos derivan de
 * `drizzle-orm/pg-core`.
 *
 * Para tests que requieran features avanzadas de Postgres no cubiertas por
 * pglite (algunas extensiones, RLS), usar testcontainers en su lugar.
 */
export const buildTestDb = async () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS examples (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      status text NOT NULL DEFAULT 'draft',
      total numeric(12, 2) NOT NULL DEFAULT '0',
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW()
    );
  `);

  return {
    db: db as unknown as Db,
    close: () => client.close(),
  };
};
