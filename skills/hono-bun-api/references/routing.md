# Routing

Cada feature exporta `build<Features>Routes(featureDeps)` desde su `index.ts`. El
archivo `<features>.routes.ts` en la raíz arma la sub-app Hono/OpenAPI y adapta cada
request a un command o query.

## Ejemplo

```ts
// features/projects/projects.routes.ts
export type ProjectsRouteDeps = {
  db: Db;
  tx: TransactionManager;
};

export const buildProjectsRoutes = (deps: ProjectsRouteDeps) => {
  const r = createApiRouter();

  r.openapi(
    createRoute({
      method: 'post',
      path: '/',
      tags: ['projects'],
      request: {
        body: { content: { 'application/json': { schema: CreateProjectInput } } },
      },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: ProjectDto } } },
      },
    }),
    async (c) => toHttpResponse(
      c,
      await createProjectCommand(deps, { ...c.req.valid('json'), actorId: c.get('auth')!.userId }),
      201,
    ),
  );

  return r;
};
```

## App Root

```ts
import { buildProjectsRoutes } from '@features/projects';

app.route(
  '/projects',
  buildProjectsRoutes({
    db: dependencies.db,
    tx: dependencies.tx,
  }),
);
app.route('/organizations', buildOrganizationsRoutes({ db: dependencies.db }));
```

Registrar rutas antes de `mountDocs(app)` para que OpenAPI incluya todos los
endpoints.

## Reglas

- `<feature>.routes.ts` define OpenAPI, HTTP method/path y adapta request/response.
- Commands y queries no importan Hono.
- No poner SQL ni reglas de negocio en routes.
- Routes reciben un tipo local de deps; no importan el root `AppDependencies`.
- Usar `requireAuth`/middleware si aplica a grupos enteros de rutas.

## Sub-recursos

Si un sub-recurso comparte el mismo bounded context, mantenerlo en la feature:

```txt
features/projects/
  projects.routes.ts
```

Si tiene reglas, ownership y lifecycle propios, promoverlo a feature.
