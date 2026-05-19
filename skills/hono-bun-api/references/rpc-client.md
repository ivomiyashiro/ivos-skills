# RPC client tipado con `hc<typeof app>`

## La magia

Hono expone un cliente fetch tipado derivado del tipo del server. Cero codegen,
cero duplicación de tipos.

## En el server

Exportar el tipo de la app:

```ts
// app.ts
export const buildApp = (deps: AppDeps) => {
  const app = new OpenAPIHono<AppEnv>();
  // ... .openapi(...) por cada endpoint
  return app;
};

export type AppType = ReturnType<typeof buildApp>;
```

## En el cliente (FE / SDK / otro servicio)

Si el FE y el BE están en el mismo monorepo:

```ts
// frontend/src/api.ts
import { hc } from 'hono/client';
import type { AppType } from '@backend/app';

export const api = hc<AppType>(import.meta.env.VITE_API_URL);

// Uso
const res = await api.examples.$post({
  json: { name: 'foo', total: 10 },
});

if (res.ok) {
  const example = await res.json();  // tipo ExampleDto, inferido!
}
```

`api.examples.$post`, `api.examples[':id'].$get`, etc. La estructura sigue las rutas.

## Métodos disponibles

```ts
api.examples.$get({ query: { status: 'active' } });
api.examples.$post({ json: input });
api.examples[':id'].$put({ param: { id }, json: input });
api.examples[':id'].$delete({ param: { id } });
```

## Si el FE NO está en el monorepo

Opción A: Publicar el tipo como paquete npm:

```ts
// packages/api-types/src/index.ts
export type { AppType } from '@backend/app';
```

Opción B: Generar SDK desde OpenAPI (`openapi-typescript-fetch`, `orval`, etc.).
Esto es codegen, pero portable a clientes que no usan Hono.

## Errores tipados

El `Result` no se serializa como union al cliente (sale como JSON plano). El cliente
mira el status code y el body:

```ts
const res = await api.examples.$post({ json: input });
if (res.status === 201) {
  const dto = await res.json();
} else if (res.status === 422) {
  const error = await res.json();  // { kind: 'Validation', issues: [...] }
} else if (res.status === 404) {
  // ...
}
```

Para tipar mejor en el cliente, podés derivar:

```ts
type CreateExampleResponses = ExtractResponse<typeof api.examples.$post>;
```

(Helper custom; Hono provee `InferResponseType<typeof endpoint, status>`.)

```ts
import type { InferResponseType } from 'hono/client';

type SuccessBody = InferResponseType<typeof api.examples.$post, 201>;
type ValidationError = InferResponseType<typeof api.examples.$post, 422>;
```

## Headers y opciones

```ts
api.examples.$post(
  { json: input },
  {
    headers: { 'authorization': `Bearer ${token}` },
    init: { credentials: 'include' },
  },
);
```

## Streaming / WebSockets

Hono soporta SSE y WebSockets; `hc` aún no los tipa al 100%. Para esos casos,
fetch raw o ws cliente standard.

## En tests

Podés usar `hc<AppType>` apuntando al server en memoria (no http):

```ts
import { testClient } from 'hono/testing';
import { buildApp } from '@/app';

const app = buildApp(testDeps);
const client = testClient(app);

const res = await client.examples.$post({ json: input });
expect(res.status).toBe(201);
```

`testClient` no bindea port — usa `app.request()` por debajo. Más rápido que
`fetch('http://localhost:...')`.

## Cuándo NO usar RPC

- **API pública** consumida por clientes que no controlás (mobile apps third-party,
  partners). Mejor publicar OpenAPI y que generen SDK.
- **Servicios poliglota.** Si tu FE es Flutter o tu otro servicio es Go, RPC client
  no aplica — usar OpenAPI.

Para el monorepo TS interno (BE Bun + FE React), RPC es excelente.

## Anti-patrones

- ❌ Duplicar tipos: declarar `interface CreateExampleInput` en el FE además de
  importar de Zod. Usar `z.infer` del schema compartido o `InferRequestType` del
  client.
- ❌ Cliente sin tipos: `fetch('/examples', { method: 'POST', body: ... })`. Perder
  type safety end-to-end.
- ❌ Exportar `AppType` con datos sensibles del server (Logger, Db). Solo el tipo
  del Hono router, que ya es seguro.
