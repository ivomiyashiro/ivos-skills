# Dependency Injection sin contenedor

## Principio

No usamos DI containers (tsyringe, inversify, awilix). En su lugar:
1. **Boot-time deps** se construyen UNA vez en `server.ts` y se pasan como argumento.
2. **Request-time deps** viven en `c.var` (tipado vía `AppEnv`).
3. **Handler deps** se arman ad-hoc en `routes.ts` antes de invocar el handler.

## Niveles de DI

### Nivel 1 — Boot time (`AppDeps`)

```ts
// server.ts
const db = buildDb(env.DATABASE_URL);
const logger = baseLogger;
const eventBus = createEventBus();

const app = buildApp({ db, logger, eventBus, clock: systemClock });
```

`AppDeps` agrupa lo que se comparte a través de toda la vida del proceso. Una sola
construcción, una sola conexión pool, un solo event bus.

### Nivel 2 — Request scope (`c.var`)

Middlewares pueblan `c.var`:

```ts
app.use('*', requestId());                  // set('requestId', uuid)
app.use('*', loggerMiddleware());            // set('logger', child)
app.use('*', authMiddleware(verifyJwt));     // set('auth', principal | null)
app.use('*', async (c, next) => { c.set('db', deps.db); await next(); });
```

`AppEnv` tipa exactamente qué vars existen:

```ts
type AppVars = {
  requestId: string;
  logger: Logger;
  db: Db;
  auth: AuthPrincipal | null;
};

const app = new OpenAPIHono<{ Variables: AppVars }>();
```

Si intentás `c.get('foo')` y `foo` no está en `AppVars`, TypeScript falla en compile.

### Nivel 3 — Handler invocation (`routes.ts`)

```ts
r.openapi(spec, async (c) => {
  const result = await createXHandler(
    {
      repo: createXRepo(c.get('db')),
      eventBus: deps.eventBus,        // viene de AppDeps via closure
      logger: c.get('logger'),
      clock: deps.clock,
      userId: c.get('auth')?.userId ?? null,
    },
    c.req.valid('json'),
  );
  return toHttpResponse(c, result, 201);
});
```

Acá se arma el `CommandDeps` específico del handler con lo que vive en `c.var`
+ lo que viene de `AppDeps` capturado en el closure.

## Por qué este enfoque

**Pros:**
- Cero magia. El grafo de dependencias es visible en el código.
- Sin reflexión, sin decoradores, sin metadata.
- Tests triviales: armás el record `deps` a mano.
- TypeScript chequea todo en compile.
- Tree-shaking funciona perfecto.

**Cons:**
- Algo más de boilerplate en `routes.ts` al armar `deps` por handler.
- Si tenés 50 features con `eventBus`, `clock`, `logger` repetidos, podés
  factorizar un helper `buildCommandDeps(c, deps, repoFactory)`.

## Helper opcional

Para reducir boilerplate, podés definir un builder genérico:

```ts
// shared/hono/build-deps.ts
export const buildCommandDeps = <R>(
  c: Context<AppEnv>,
  deps: AppDeps,
  repoFactory: (db: Db) => R,
) => ({
  repo: repoFactory(c.get('db')),
  eventBus: deps.eventBus,
  logger: c.get('logger'),
  clock: deps.clock,
  userId: c.get('auth')?.userId ?? null,
});

// uso
r.openapi(spec, async (c) => {
  const result = await createXHandler(
    buildCommandDeps(c, deps, createXRepo),
    c.req.valid('json'),
  );
  return toHttpResponse(c, result, 201);
});
```

Mantenelo opcional — añadirlo cuando la repetición duela, no antes.

## Acceso a `AppDeps` en middlewares

Si un middleware necesita algo de `AppDeps` (raro, pero pasa con auth o feature
flags), lo construís con factory:

```ts
export const someMiddleware = (deps: AppDeps): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    // usa deps.eventBus, deps.clock, etc.
    await next();
  };

// app.ts
app.use('*', someMiddleware(deps));
```

## Tests

```ts
test('handler con deps mockeadas', async () => {
  const deps = {
    repo: {
      findById: mock(async () => null),
      save: mock(async () => {}),
      delete: mock(async () => {}),
    },
    eventBus: {
      publish: mock(() => {}),
      publishMany: mock(() => {}),
      on: mock(() => {}),
      off: mock(() => {}),
    },
    logger: silentLogger,
    clock: { now: () => new Date('2026-05-12') },
    userId: 'u1',
  };
  await createXHandler(deps, input);
  expect(deps.repo.save).toHaveBeenCalled();
});
```

No hay `Container.register(...)`, no hay `await container.resolve(XHandler)`.

## Anti-patrones

- ❌ Module-level singletons: `export const db = buildDb(...)`. Mata testabilidad
  y hace el orden de imports significativo.
- ❌ Importar `c` (Hono context) dentro del handler. El handler debe ser
  HTTP-agnostic.
- ❌ Pasar el `Container` completo. Pasar solo lo que el handler usa.
- ❌ Decoradores `@injectable`. Estamos en Bun + TS plano.
