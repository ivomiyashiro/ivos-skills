# Read Context: por qué queries bypassan el repo

## La regla

**Repositorios solo para escritura.** Las queries no instancian repos; reciben un
`ReadContext` y leen directo de `ctx.db`.

## ReadContext

```ts
type ReadContext = {
  db: Db;
  logger: Logger;
  auth: AuthPrincipal | null;
};
```

Cada feature puede extenderlo si necesita deps específicas de read:

```ts
// features/quotes/read-context.ts
export type QuotesReadContext = ReadContext & {
  cache?: Cache;
  searchIndex?: SearchClient;
};

export const buildQuotesReadContext = (c: Context<AppEnv>): QuotesReadContext => ({
  db: c.get('db'),
  logger: c.get('logger'),
  auth: c.get('auth'),
});
```

Normalmente es solo un alias.

## Por qué no usar el repo

Imaginá un repo con métodos de read:

```ts
// MAL
export const createQuotesRepo = (db) => ({
  findById: async (id) => /* devuelve QuoteRow */,
  findByCustomer: async (customerId) => /* devuelve QuoteRow[] */,
  listActive: async () => /* devuelve QuoteRow[] */,
  searchByText: async (q) => /* devuelve QuoteRow[] */,
  countByStatus: async () => /* devuelve { status, count }[] */,
  // 20 métodos más, uno por cada GET
});
```

Problemas:
1. **God object.** Crece sin techo.
2. **Acoplamiento 1:1 con endpoints.** Cada nuevo GET es un método nuevo en el repo
   — la promesa de abstracción se rompe.
3. **No matchea read needs.** Los reads quieren proyectar a DTOs específicos del
   endpoint, joinear con otras tablas, paginar. Esto es lo opuesto a "encapsular
   el agregado".
4. **Imposible reusar la query.** Si dos endpoints quieren listados parecidos pero
   con diferentes campos, terminás con `findByCustomerForList`, `findByCustomerForExport`,
   etc.

## Por qué un `ctx.db` plano es mejor

- **El query handler ES la abstracción.** Cada endpoint es un caso de uso; su
  query es parte de su contrato.
- **Proyección a DTO en SQL.** `.select({ id: ..., name: ..., customerName: ... })`
  devuelve directamente el shape del DTO.
- **Joins libres.** Una query de quotes puede leer customers, items, lo que sea.
  El repo de quotes no necesita conocer customers.
- **Performance directa.** Sin capas de mapeo en código, sin "primero cargo el
  agregado y después proyecto".

## Cuándo SÍ se justifica abstraer un read

- **Reuso real entre features.** Una función `findCustomerById` que devuelve algo
  genérico y la usan 5 features → va a `shared/`.
- **Cache layer.** Si querés intercalar cache entre la query y la DB, podés envolver
  el `ctx.db` en una capa que cachee — pero eso es un decorador, no un repo de
  business.
- **Search index.** Si una query usa Elasticsearch, no Postgres, el handler usa
  `ctx.searchIndex` (que es otra dep del ReadContext), no un repo.

## Tests de queries

```ts
test('get X by id retorna DTO', async () => {
  const ctx = { db: await buildTestDb(), logger: silentLogger, auth: null };
  await seedX(ctx.db, { id: 'aaa', name: 'foo' });

  const result = await getXByIdHandler(ctx, { id: 'aaa' });

  expect(result.ok).toBe(true);
  expect(result.value).toMatchObject({ id: 'aaa', name: 'foo' });
});
```

Sin mocks de "fakeQueryRepo". El handler recibe un `db` real o un `db` testcontainer.

## Anti-patrones

- ❌ Crear un "QueryService" con clase + métodos por endpoint.
- ❌ Pasar el `repo` al query handler.
- ❌ "Por simetría, hagamos un read-repo además del write-repo." No. Asimetría
  intencional.
