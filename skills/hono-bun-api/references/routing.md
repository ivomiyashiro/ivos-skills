# Routing: composición y RPC inference

## Patrón canónico

Cada feature exporta una función `buildXRoutes(deps): OpenAPIHono<AppEnv>` que arma
una sub-app de Hono con todos sus endpoints. La app raíz mountea cada feature en su
prefijo.

```ts
// features/quotes/routes.ts
export const buildQuotesRoutes = (deps: AppDeps) => {
  const r = new OpenAPIHono<AppEnv>();
  // ... .openapi(spec, handler) por cada endpoint
  return r;
};

// app.ts
app.route('/quotes', buildQuotesRoutes(deps));
app.route('/customers', buildCustomersRoutes(deps));
```

## Por qué `OpenAPIHono` (no `Hono`)

Permite usar `app.openapi(routeSpec, handler)` que registra simultáneamente:
- La ruta en el router.
- El schema en el OpenAPI registry.
- La validación de request (vía `request.body/params/query`).
- El typing del handler (`c.req.valid('json')` infiere desde el spec).

Si querés rutas que NO van a OpenAPI (ej. health, metrics, internal), usá `app.get/post`
directo — son compatibles.

## Convención de paths

- **Plural en kebab-case:** `/quotes`, `/customer-orders`.
- **`{id}` con UUID:** `/quotes/{id}`, no `/quotes/:id` (sintaxis OpenAPI). En Hono
  con `OpenAPIHono` ambos funcionan; usar `{id}` por consistencia con la spec.
- **Sub-recursos:** `/quotes/{id}/items` para colecciones anidadas. Si la cosa anidada
  vive por sí sola, dale su propio feature.

## RPC type inference

Exportar `AppType` desde `app.ts`:

```ts
export type AppType = ReturnType<typeof buildApp>;
```

Cliente FE/SDK puede derivar tipos del server:

```ts
import { hc } from 'hono/client';
import type { AppType } from 'server/src/app';

const client = hc<AppType>('http://localhost:3000');
// client.quotes.$post({ json: input }) — tipo derivado del server
```

Ver `references/rpc-client.md` para detalle.

## Sub-apps anidadas

Si un feature tiene sub-recursos complejos:

```ts
// features/quotes/routes.ts
const items = new OpenAPIHono<AppEnv>();
items.openapi(getItemsSpec, ...);

const r = new OpenAPIHono<AppEnv>();
r.openapi(createQuoteSpec, ...);
r.route('/{quoteId}/items', items);  // /quotes/{quoteId}/items
return r;
```

## Middlewares por ruta

Cada `r.openapi()` puede recibir middlewares específicos en el spec:

```ts
r.openapi(
  createRoute({ method: 'post', path: '/', middleware: [requireAuth, requireRole('admin')] as const, ... }),
  handler,
);
```

Para protección a nivel feature entero:

```ts
const r = new OpenAPIHono<AppEnv>();
r.use('*', requireAuth);
r.openapi(...);
```

## Anti-patrones

- ❌ `r.route()` dentro del handler de un endpoint.
- ❌ Lógica de negocio en `routes.ts`. El archivo es plumbing puro.
- ❌ Catchear errores y mapear status code manualmente en cada ruta. Usar
  `toHttpResponse(c, result)` que ya hace el switch exhaustivo.
- ❌ Pasar `c` al handler de comando/query. El handler recibe `deps`/`ctx` planos
  para mantenerse testeable sin Hono.
