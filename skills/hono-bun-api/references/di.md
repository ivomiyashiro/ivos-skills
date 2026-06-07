# Dependency Injection Sin Container Pesado

En esta skill, DI significa **pasar dependencias desde afuera**. No implica usar
decorators, reflection, `container.resolve()` ni una librería tipo `inversify`.

## Regla Práctica

```txt
Función pura -> no DI.
Use case con IO -> deps explícitas.
Deps repetidas en varios controllers -> factory por feature.
DI container library -> solo si hay lifetimes/grafo complejo real.
```

## Por Qué Pasar Deps

Pasar deps como objeto da:

- tests sin mockear módulos globales
- transacciones explícitas con `txDb`
- `clock`, `logger`, `eventBus`, `auth` reemplazables
- use cases ejecutables desde HTTP, jobs, scripts o tests
- imports menos mágicos que `import { db } from '@shared/db'`

El costo es verbosidad. Cuando empieza a molestar, usar una factory por feature.

## Composition Root

Crear recursos de app una vez en `container.ts`:

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

`buildApp(container)` registra middlewares y monta features. Los controllers reciben
el container vía closure.

## Deps Explícitas En Use Cases

```ts
export const createExampleCommand = async (
  deps: {
    createRepo: (db: Db) => ExampleRepository;
    tx: TransactionManager;
    clock: Clock;
  },
  command: CreateExampleCommand,
) => {
  return deps.tx.run(async (db) => {
    const repo = deps.createRepo(db);
    // ...
  });
};
```

El use case no recibe `container`, no importa Hono y no importa un singleton global
de DB.

## Factory Por Feature

Cuando varios controllers repiten deps, crear una factory liviana:

```ts
export type ExampleUseCasesDeps = {
  createRepo: (db: Db) => ExampleRepository;
  readModel: ExampleReadModel;
  tx: TransactionManager;
  eventBus: EventBus;
  logger: Logger;
  clock: Clock;
};

export const createExampleUseCases = (deps: ExampleUseCasesDeps) => ({
  create: (command: CreateExampleCommand) => createExampleCommand(deps, command),
  update: (command: UpdateExampleCommand) => updateExampleCommand(deps, command),
  list: (query: ListExamplesQueryRequest) => listExamplesQuery({ readModel: deps.readModel }, query),
});
```

El controller queda como adapter:

```ts
const buildUseCases = (container: AppContainer, c: Context<AppEnv>) =>
  createExampleUseCases({
    createRepo: container.createExampleRepository,
    readModel: container.exampleReadModel,
    tx: container.tx,
    eventBus: container.eventBus,
    logger: c.get('logger'),
    clock: container.clock,
  });
```

## Alternativas Y Tradeoffs

| Opción | Usar cuando | Costo |
|---|---|---|
| Imports directos | scripts chicos o prototipos | tests y transacciones más frágiles |
| Deps explícitas | default para use cases con IO | algo verboso |
| Factory por feature | deps repetidas en controllers | una capa más |
| Context object global | equipos chicos que aceptan acoplamiento | puede volverse service locator |
| DI container | lifetimes complejos, plugins, muchas implementaciones | magia, setup y debugging extra |

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
- usar `mock.module('@shared/db/client')` como default de testing
- registrar dependencias con strings mágicos
- construir repositories dentro de entidades/utils
