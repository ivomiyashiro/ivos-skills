# Routing

Cada feature exporta `build<Features>Routes(container)` desde su `index.ts`. El
archivo `routes/<features>.routes.ts` arma la sub-app Hono/OpenAPI y conecta cada
ruta con su controller.

## Ejemplo

```ts
// features/projects/routes/projects.routes.ts
export const buildProjectsRoutes = (container: AppContainer) => {
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
    createProjectController(container),
  );

  return r;
};
```

## App Root

```ts
import { buildProjectsRoutes } from '@features/projects';

app.route('/projects', buildProjectsRoutes(container));
app.route('/organizations', buildOrganizationsRoutes(container));
```

Registrar rutas antes de `mountDocs(app)` para que OpenAPI incluya todos los
endpoints.

## Reglas

- Routes definen OpenAPI y HTTP method/path.
- Controllers adaptan request/response.
- Use cases no importan Hono.
- No poner SQL ni reglas de negocio en routes.
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
