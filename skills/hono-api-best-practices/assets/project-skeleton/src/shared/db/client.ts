import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Cliente Postgres compartido. Pool de 20 conexiones default.
 * Para una alternativa (Kysely o Bun.sql nativo) ver references/database.md.
 */
export const buildDb = (databaseUrl: string) => {
  const sql = postgres(databaseUrl, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  return drizzle(sql, { schema });
};

export type Db = PostgresJsDatabase<typeof schema>;
export { schema };
