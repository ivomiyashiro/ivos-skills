import { sql } from 'drizzle-orm';
import { buildDb } from '@shared/db/client';
import { env } from '@shared/config/env';

/**
 * Connect to the Docker Compose Postgres instance used by integration tests.
 */
export const buildTestDb = async () => {
  const { db, close } = buildDb(env.DATABASE_URL);

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

  await db.execute(sql`TRUNCATE TABLE examples`);

  return { db, close };
};
