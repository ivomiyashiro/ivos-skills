# Dependency Injection Sin Container Pesado

En esta skill, DI significa **pasar dependencias desde afuera**. No implica usar
decorators, reflection, `container.resolve()` ni una librería tipo `inversify`.

## Regla Práctica

```txt
Función pura -> no DI.
Use case con IO -> deps explícitas.
Deps repetidas entre operaciones -> pasar solo el subconjunto necesario a cada operación.
DI container library -> solo si hay lifetimes/grafo complejo real.
```

## Por Qué Pasar Deps

Pasar deps como objeto da:

- tests sin mockear módulos globales
- transacciones explícitas con `txDb`
- `clock`, `logger`, `eventBus`, `auth` reemplazables
- commands y queries ejecutables desde HTTP, jobs, scripts o tests
- imports menos mágicos que `import { db } from '@shared/db'`

El costo es verbosidad, pero evita un service locator y hace visibles los límites de
cada operación.

## Composition Root

Crear recursos de app una vez en `di-container.ts`:

```ts
export function createContainer() {
  const db = buildDb(env.DATABASE_URL);
  const tx = createTransactionManager(db);
  const eventBus = createEventBus();
  const logger = baseLogger;

  return {
    db,
    tx,
    eventBus,
    logger,
  };
}

export type AppDependencies = ReturnType<typeof createContainer>;
```

`buildApp(dependencies)` registra middlewares y es el único borde HTTP que conoce
`AppDependencies`. Al montar una feature, crea un objeto literal con las deps que
esa feature necesita. Una feature no importa `AppDependencies` ni usa
`Pick<AppDependencies, ...>`.

```ts
type ExampleFeatureDeps = {
  db: Db;
  tx: TransactionManager;
  eventBus: EventBus;
  clock: Clock;
};

app.route(
  '/examples',
  buildExamplesRoutes({
    db: dependencies.db,
    tx: dependencies.tx,
    eventBus: dependencies.eventBus,
    clock: dependencies.clock,
  }),
);
```

## Deps Explícitas En Operaciones

```ts
export const createExampleCommand = async (
  deps: {
    tx: TransactionManager;
    clock: Clock;
  },
  command: CreateExampleCommand,
) => {
  return deps.tx.run(async (db) => {
    await db.insert(examples).values({ name: command.name });
  });
};
```

La operación no recibe `container`, no importa Hono y no importa un singleton global
de DB.

## Routes Y Operaciones

La route es el único adapter HTTP. Recibe las deps de feature y pasa a cada
operación solo las que usa:

```ts
routes.openapi(route, async (c) =>
  toHttpResponse(
    c,
    await createExampleCommand(
      { tx: deps.tx, eventBus: deps.eventBus, clock: deps.clock },
      { ...c.req.valid('json'), actorId: c.get('auth')!.userId },
    ),
    201,
  ),
);
```

## Alternativas Y Tradeoffs

| Opción | Usar cuando | Costo |
|---|---|---|
| Imports directos | scripts chicos o prototipos | tests y transacciones más frágiles |
| Deps explícitas | default para commands/queries con IO | algo verboso |
| Objeto de deps de feature | una route monta varias operaciones | la route elige subconjuntos explícitos |
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

Para lógica pura, construir deps simples o llamar el helper directamente desde un
test co-localizado. Para integration de Hono, crear el composition root contra
Postgres real de Docker Compose, con preload, migraciones y seed; no usar mocks de
database ni Supabase.

## Anti-Patrones

- module-level singleton `export const db = buildDb(...)`
- pasar `AppDependencies` o `Pick<AppDependencies, ...>` a una feature
- pasar `container` completo a cada command/query
- importar Hono context en commands/queries
- usar `mock.module('@shared/db/client')` como default de testing
- registrar dependencias con strings mágicos
- crear helpers o repositories por defecto en vez de usar Drizzle directo
