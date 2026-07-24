# Routing

Cada feature exporta `build<Features>Routes(featureDeps)` desde su `index.ts`. El
archivo `routes/<features>.routes.ts` arma la sub-app Hono/OpenAPI y conecta cada
ruta con su controller.

## Ejemplo

```ts
// features/projects/routes/projects.routes.ts
export type ProjectsRouteDeps = {
  projectReadModel: ProjectReadModel;
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
    createProjectController(deps),
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
    projectReadModel: dependencies.projectReadModel,
    tx: dependencies.tx,
  }),
);
app.route('/organizations', buildOrganizationsRoutes({ organizationReadModel: dependencies.organizationReadModel }));
```

Registrar rutas antes de `mountDocs(app)` para que OpenAPI incluya todos los
endpoints.

## Reglas

- Routes definen OpenAPI y HTTP method/path.
- Controllers adaptan request/response.
- Use cases no importan Hono.
- No poner SQL ni reglas de negocio en routes.
- Routes y controllers reciben un tipo local de deps; no importan el root `AppDependencies`.
- Usar `requireAuth`/middleware si aplica a grupos enteros de rutas.

## Sub-recursos

Si un sub-recurso comparte el mismo bounded context, mantenerlo en la feature:

```txt
features/projects/
  routes/
    projects.routes.ts
    project-tasks.routes.ts
```

Si tiene reglas, ownership y lifecycle propios, promoverlo a feature.
