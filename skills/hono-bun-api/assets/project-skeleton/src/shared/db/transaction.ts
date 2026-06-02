import type { Db } from './client';

export type TransactionManager = {
  run<T>(fn: (db: Db) => Promise<T>): Promise<T>;
};

/**
 * TransactionManager — explicita el boundary transaccional de los commands.
 * El handle `tx` pasado a `fn` es compatible con Db para crear repos/read models.
 */
export const createTransactionManager = (db: Db): TransactionManager => ({
  run: (fn) => db.transaction(async (tx) => fn(tx as Db)),
});
