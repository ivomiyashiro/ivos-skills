# OpenAPI con @hono/zod-openapi + Scalar

## Setup

```bash
bun add @hono/zod-openapi @scalar/hono-api-reference
```

## App raíz

```ts
import { OpenAPIHono } from '@hono/zod-openapi';
const app = new OpenAPIHono<AppEnv>();
```

`OpenAPIHono` extiende `Hono` con:
- `app.openapi(spec, handler)` — registra ruta + schema.
- `app.doc(path, info)` — sirve el JSON OpenAPI en el path dado.
- `app.openAPIRegistry` — para registrar componentes (auth schemes, etc.).

## Definir un endpoint

```ts
import { createRoute, z } from '@hono/zod-openapi';

const route = createRoute({
  method: 'post',
  path: '/{id}',
  tags: ['examples'],
  summary: 'Actualizar un example',
  description: 'Modifica nombre, status o total. Retorna el DTO actualizado.',
  request: {
    params: ExampleIdParam,
    query: SomeQuery,  // opcional
    body: { content: { 'application/json': { schema: UpdateExampleInput } } },
  },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: ExampleDto } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorBody } } },
    422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } },
  },
});

r.openapi(route, async (c) => {
  const { id } = c.req.valid('param');
  const input = c.req.valid('json');
  // ...
});
```

`c.req.valid(target)` retorna el tipo inferido del schema del `request[target]`.

## Componentes reutilizables

Schemas con `.openapi(name)`:

```ts
const ExampleDto = z.object({ /* ... */ }).openapi('ExampleDto');
```

Se referencian como `#/components/schemas/ExampleDto` en la spec.

## Auth schemes

```ts
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// En una ruta
const route = createRoute({
  // ...
  security: [{ Bearer: [] }],
});
```

## Servir la spec y Scalar UI

```ts
// shared/openapi/docs.ts
import { apiReference } from '@scalar/hono-api-reference';

export const mountDocs = (app: OpenAPIHono<AppEnv>) => {
  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'API', version: '0.1.0' },
    servers: [{ url: 'http://localhost:3000', description: 'local' }],
  });

  app.get('/docs', apiReference({ spec: { url: '/openapi.json' } }));
};

// app.ts
buildApp(deps) {
  // ... registrar rutas ...
  mountDocs(app);
  return app;
}
```

Llamar `mountDocs` DESPUÉS de registrar todas las features para que la spec esté
completa.

## Ordering matter

```ts
const app = new OpenAPIHono<AppEnv>();

// 1. Middlewares globales (request-id, logger, auth)
app.use('*', requestId());
app.use('*', loggerMiddleware());

// 2. Probes (que NO deben aparecer en docs si no queremos)
app.get('/healthz', ...);  // no usa .openapi(), no aparece en spec

// 3. Features con .openapi()
app.route('/examples', buildExampleRoutes(deps));

// 4. Docs (DESPUÉS de todo lo de arriba)
mountDocs(app);
```

## Excluir endpoints del spec

Usar `app.get/post/...` directo (sin `.openapi()`). El endpoint queda en el router
pero no en la spec. Útil para `/healthz`, `/metrics`, `/internal/*`.

## Validación automática de respuestas

`OpenAPIHono` valida el shape del response al runtime contra los schemas declarados
solo si pasás `validateResponse: true` en la config. Default OFF (performance).
En dev, activarlo para detectar drift early.

## Versionado del API

Opciones:
1. **Subpath:** `/v1/examples`, `/v2/examples`. Cada uno con su `OpenAPIHono` separado.
2. **Header:** rechazar requests sin `Accept-Version` o redirigir.
3. **Single spec evolving:** mantener un solo `/openapi.json` con backward compat.

Para empezar, opción 1 es la más simple.

## Spec en disco (opcional)

Para CI o publicación al portal:

```ts
// scripts/generate-spec.ts
import { buildApp, systemClock } from '../src/app';
import { writeFileSync } from 'node:fs';

const app = buildApp({ db: {} as any, logger: {} as any, eventBus: {} as any, clock: systemClock });
const spec = app.getOpenAPIDocument({
  openapi: '3.1.0',
  info: { title: 'API', version: '0.1.0' },
});
writeFileSync('openapi.json', JSON.stringify(spec, null, 2));
```

```bash
bun run scripts/generate-spec.ts
```

Útil para code-gen client SDKs.

## Anti-patrones

- ❌ Mantener una spec OpenAPI separada en YAML, paralela al código. Pierde
  sincronización inmediatamente.
- ❌ No declarar errors 4xx/5xx en `responses`. Si el cliente no sabe que puede
  recibir 404, va a sorprenderse.
- ❌ Schemas inline en cada `.openapi(spec)`. Usar `.openapi(name)` para que
  se referencien como `$ref`.
- ❌ Olvidar `tags`. Sin tags Scalar muestra todo junto sin agrupación.
