import type { Db } from './client';

/**
 * withTransaction — ejecuta `fn` dentro de una transacción. Si lanza, rollback.
 * El handle `tx` pasado a `fn` es del mismo tipo que `Db` — los repos creados
 * con ese tx persisten dentro de la transacción.
 */
export const withTransaction = <T>(db: Db, fn: (tx: Db) => Promise<T>): Promise<T> =>
  db.transaction(async (tx) => fn(tx as Db));
