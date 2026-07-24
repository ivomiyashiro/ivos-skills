# Transacciones

Usar transacciones explicitas para operaciones de escritura que deben commitear o
rollbackear como unidad.

## Transaction Manager

```ts
export type TransactionManager = {
  run<T>(fn: (db: Db) => Promise<T>): Promise<T>;
};

export const createTransactionManager = (db: Db): TransactionManager => ({
  run: (fn) => db.transaction((tx) => fn(tx as Db)),
});
```

## Uso

```ts
await tx.run(async (db) => {
  const projectRepo = new DrizzleProjectRepository(db);
  const outbox = new DrizzleOutbox(db);

  await projectRepo.save(project);
  await outbox.add(project.pullEvents());
});
```

## Cuándo Usar

- multiple writes relacionados
- entidad + outbox event
- cambio de estado + audit log
- crear organization + membership inicial
- billing updates con invoice/subscription

## Anti-Patrones

- transaccion abierta mientras se llama a email/Stripe/webhook
- publicar eventos antes del commit
- esconder transacciones dentro de routes
- usar transaccion para read-only queries simples
