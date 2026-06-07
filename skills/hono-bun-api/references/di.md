# Dependency Injection Sin Container Pesado

Usar composition root manual. Evitar `tsyringe`, `inversify` o decorators hasta que
el grafo de dependencias lo justifique.

## Container

```ts
export function createContainer() {
  const db = buildDb(env.DATABASE_URL);
  const tx = createTransactionManager(db);
  const eventBus = createEventBus();
  const logger = baseLogger;

  const exampleReadModel = new ExampleReadModel(db);

  return {
    db,
    tx,
    eventBus,
    logger,
    exampleReadModel,
    createExampleRepository: (db: Db) => new DrizzleExampleRepository(db),
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
```

## App

```ts
const container = createContainer();
const app = buildApp(container);

app.route('/examples', buildExamplesRoutes(container));
```

`buildApp(container)` registra middlewares y monta features. Los controllers reciben
el container vía closure.

## Controllers

Pasar solo dependencias necesarias al use case:

```ts
export const createExampleController =
  (container: AppContainer) =>
  async (c: Context<AppEnv>) => {
    const body = c.req.valid('json');
    const auth = c.get('auth');

    const result = await createExampleCommand(
      {
        createRepo: container.createExampleRepository,
        tx: container.tx,
        eventBus: container.eventBus,
        clock: container.clock,
        logger: c.get('logger'),
      },
      { ...body, actorId: auth?.userId ?? null },
    );

    return toHttpResponse(c, result, 201);
  };
```

## Request Scope

Middlewares ponen en `c.var` solo valores del request:

- `requestId`
- child `logger`
- `auth`
- `db` si un endpoint necesita read context directo

No crear DB pool ni repos por request salvo que el command necesite un handle
transaccional específico.

## Testing

Para unit tests de use cases, construir deps fake a mano. Para integration tests de
Hono, crear un container de test con DB de test y adapters fake.

## Anti-Patrones

- module-level singleton `export const db = buildDb(...)`
- pasar `container` completo a cada use case
- importar Hono context en use cases/utils
- registrar dependencias con strings mágicos
- construir repositories dentro de entidades/utils
