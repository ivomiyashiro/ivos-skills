# API (Hono + Bun)

API opinada en TypeScript con vertical slice + CQRS lite. Scaffold del skill
`hono-bun-api`.

## Stack

- **Bun** ≥ 1.1 (runtime, test, package manager)
- **Hono 4** + `@hono/zod-openapi` + Scalar UI
- **Zod 3** (validación + OpenAPI)
- **Drizzle ORM** + postgres.js
- **Pino** (structured logs)
- **prom-client** (`/metrics`)

## Arrancar

```bash
bun install
cp .env.example .env
# editar DATABASE_URL
bun run db:migrate
bun run dev
```

- Server: http://localhost:3000
- Docs: http://localhost:3000/docs
- Healthz: http://localhost:3000/healthz
- Readyz: http://localhost:3000/readyz
- Metrics: http://localhost:3000/metrics

## Estructura

```
src/
  server.ts                  # Bun.serve + signals
  app.ts                     # OpenAPIHono + middlewares + mount features
  shared/                    # Cross-feature: db, errors, result, middlewares...
  features/
    _example/                # Feature de referencia (Rosetta Stone)
    <tu-feature>/            # Generado con bun run scaffold <name>
```

## Crear un feature nuevo

```bash
bun run scaffold pedidos
```

Luego en `src/app.ts`:

```ts
import { buildPedidosRoutes } from '@features/pedidos/routes';
app.route('/pedidos', buildPedidosRoutes(deps));
```

## Convenciones

Las reglas están en el skill `hono-bun-api` (`SKILL.md` + `references/*.md`):

1. Funciones, sin clases.
2. Result, no throw para errores de negocio.
3. Zod en todo borde HTTP.
4. Repos solo escritura; queries usan ReadContext.
5. OpenAPI nace del mismo Zod.
6. Logs estructurados con `requestId`.

## Testing

```bash
bun test
```

- Unit: pasar `deps` mockeadas a handlers.
- Integration: `app.request(url, init)` (in-memory, sin port).

## Build

```bash
bun run build
bun run dist/server.js
```
