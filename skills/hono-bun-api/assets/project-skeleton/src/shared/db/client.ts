import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

export type DbClientOptions = {
  max: number;
  prepare: boolean;
};

export const resolveDbClientOptions = ({
  poolMax,
  prepare,
  transactionPooler,
}: {
  poolMax: number;
  prepare: boolean;
  transactionPooler: boolean;
}): DbClientOptions => ({
  max: poolMax,
  prepare: transactionPooler ? false : prepare,
});

/**
 * Cliente Postgres compartido. Pool de 20 conexiones default.
 * Retorna { db, close } — close() drena el pool al shutdown.
 * Mantener el driver y sus opciones en el composition root si el proyecto cambia de cliente.
 */
export const buildDb = (databaseUrl: string, options: DbClientOptions = { max: 20, prepare: true }) => {
  const sql: Sql = postgres(databaseUrl, {
    max: options.max,
    prepare: options.prepare,
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
