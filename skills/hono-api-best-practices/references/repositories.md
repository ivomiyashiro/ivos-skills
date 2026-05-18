# Repositories

## Forma canónica

Factory function que retorna un record de funciones, cerrando sobre el handle de DB:

```ts
export type XRepo = ReturnType<typeof createXRepo>;

export const createXRepo = (db: Db) => ({
  findById: async (id: string): Promise<XRow | null> => { /* ... */ },
  save: async (entity: XInsert): Promise<void> => { /* ... */ },
  delete: async (id: string): Promise<void> => { /* ... */ },
});
```

## Métodos permitidos

| Método | Propósito | OK |
|---|---|---|
| `findById(id)` | Cargar el agregado para mutar | ✅ |
| `save(entity)` | Insert o update (upsert) | ✅ |
| `delete(id)` | Borrar | ✅ |
| `findByX(x)` | Cargar para mutar por otro criterio (idempotencyKey, naturalId) | ✅ con justificación |

## Métodos prohibidos

| Método | Por qué prohibido |
|---|---|
| `findAll()`, `list()` | Es una query, vive en `queries/` con `ReadContext`. |
| `findActive()`, `findByCustomer()` | Idem. Repos no proyectan ni listan. |
| `query(filters)` | God object. Cada query es un caso de uso. |
| `count()` | Es una query. |
| Cualquier `getXDto()` | Repos retornan filas del DB, no DTOs públicos. |

## Por qué `findById` está OK

`findById` retorna el agregado completo para que el command pueda mutarlo y guardarlo.
Es parte del ciclo write. NO se usa para responder a un GET (eso es una query
que proyecta a DTO).

## Tipos de retorno

- `findById` retorna `XRow | null` (shape del DB inferido por Drizzle).
- `save` retorna `void`. Si necesitás el ID generado, generalo en el command antes
  de llamar `save` (`crypto.randomUUID()`).
- `delete` retorna `void`. Si necesitás saber si borró algo, ese es un query previo.

## Transacciones

El repo se construye sobre un handle `Db`. Dentro de `withTransaction`, el handle `tx`
es del mismo tipo, así que el mismo factory funciona:

```ts
await withTransaction(deps.db, async (tx) => {
  const repo = createXRepo(tx);  // ← repo sobre la tx
  await repo.save(entity);
  // ... más writes en la misma tx
});
```

No hay "repo transaccional" vs "repo normal". El handle hace la diferencia.

## Upsert

`onConflictDoUpdate` cubre create-or-update. Útil para save() único:

```ts
save: async (entity: XInsert) => {
  await db
    .insert(xs)
    .values(entity)
    .onConflictDoUpdate({
      target: xs.id,
      set: { ...entity, updatedAt: new Date() },
    });
},
```

Si querés diferenciar insert vs update, usá dos métodos separados (`insert` y
`update`) o el command decide y llama uno u otro.

## Concurrency control (opcional)

Si necesitás optimistic locking (impedir overwrites concurrentes), agregar un
campo `version`:

```sql
ALTER TABLE xs ADD COLUMN version INT NOT NULL DEFAULT 0;
```

```ts
save: async (entity: XRow & { version: number }) => {
  const result = await db
    .update(xs)
    .set({ ...entity, version: entity.version + 1 })
    .where(and(eq(xs.id, entity.id), eq(xs.version, entity.version)))
    .returning({ id: xs.id });
  if (result.length === 0) {
    throw new Error('OptimisticLockFailed');  // sube como AppError Conflict
  }
},
```

(El throw se atrapa y se convierte a `Result.failure({ kind: 'Conflict' })` arriba.)

## Tests del repo

Tests de repo son tests de integración contra DB real. Usar pglite o testcontainers:

```ts
test('save y findById round-trip', async () => {
  const db = await buildTestDb();
  const repo = createXRepo(db);
  const entity = { id: crypto.randomUUID(), name: 'foo', /* ... */ };
  await repo.save(entity);
  const found = await repo.findById(entity.id);
  expect(found).toMatchObject(entity);
});
```

Ver `references/testing.md`.

## Repos compartidos entre features

**No.** Cada feature dueño de un agregado tiene su repo. Si un feature B necesita
"crear un X", emite un comando vía evento que feature A maneja, o B llama a la
HTTP API de A (cross-service).

## Anti-patrones

- ❌ Repo con 15 métodos `findByX`. Movelo a queries.
- ❌ Repo que retorna DTOs. Retorna `XRow` del DB.
- ❌ Repo que conoce de auth/logger. Esas son responsabilidades del handler.
- ❌ Repo que loguea por su cuenta. El logger se inyecta en el handler.
- ❌ Repo que hace `console.log` o `throw new Error('xxx')`. Errores suben al handler.
