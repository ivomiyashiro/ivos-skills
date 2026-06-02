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

  const exampleRepo = new DrizzleExampleRepository(db);
  const exampleReadModel = new ExampleReadModel(db);

  return {
    db,
    tx,
    eventBus,
    logger,
    exampleRepo,
    exampleReadModel,
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
```

## App

```ts
const container = createContainer();
const app = buildApp(container);
```

`buildApp(container)` registra middlewares y monta modulos. Los controllers reciben
el container via closure:

```ts
app.route('/examples', buildExamplesRoutes(container));
```

## Controllers

Pasar solo dependencias necesarias al handler:

```ts
export const createExampleController =
  (container: AppContainer) =>
  async (c: Context<AppEnv>) => {
    const body = c.req.valid('json');
    const auth = c.get('auth');

    const result = await createExampleHandler(
      {
        repo: container.exampleRepo,
        tx: container.tx,
        eventBus: container.eventBus,
        clock: container.clock,
        logger: c.get('logger'),
      },
      { ...body, actorId: auth!.userId },
    );

    return toHttpResponse(c, result, 201);
  };
```

## Request Scope

Middlewares ponen en `c.var` solo valores del request:
- `requestId`
- child `logger`
- `auth`

No crear DB pool ni repos por request salvo que el command necesite un handle
transaccional especifico.

## Testing

Para unit tests de application handlers, construir deps fake a mano. Para integration
tests de Hono, crear un container de test con DB de test y adapters fake.

## Anti-Patrones

- module-level singleton `export const db = buildDb(...)`
- pasar `container` completo a cada handler
- importar Hono context en application/domain
- registrar dependencias con strings magicos
- construir repositorios dentro de entities/domain objects
