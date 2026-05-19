import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

/**
 * Cliente Postgres compartido. Pool de 20 conexiones default.
 * Retorna { db, close } — close() drena el pool al shutdown.
 * Alternativas (Kysely, Bun.sql) en references/database.md.
 */
export const buildDb = (databaseUrl: string) => {
  const sql: Sql = postgres(databaseUrl, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  const db = drizzle(sql, { schema });
  return {
    db,
    /** Drena conexiones in-flight, espera hasta `timeoutSec` y cierra el pool. */
    close: (timeoutSec = 5) => sql.end({ timeout: timeoutSec }),
  };
};

export type Db = PostgresJsDatabase<typeof schema>;
export { schema };
