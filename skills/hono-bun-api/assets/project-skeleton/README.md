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
# editar DATABASE_URL (Supabase Postgres URL funciona) y SUPABASE_*
bun run db:migrate
bun run dev
```

- Server: http://localhost:3000
- Docs: http://localhost:3000/docs
- Healthz: http://localhost:3000/healthz
- Readyz: http://localhost:3000/readyz
- Metrics: http://localhost:3000/metrics

## Auth (Supabase)

El skeleton trae `src/shared/auth/supabase.ts` con `createSupabaseVerify` listo
para usar. En `src/app.ts` se conecta automáticamente si `SUPABASE_JWT_SECRET`
está definido:

1. Crear proyecto en Supabase.
2. Copiar las claves desde Dashboard → Project Settings → API:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_JWT_SECRET` (en "JWT Settings")
3. Pegarlas en `.env`. El authMiddleware empezará a validar Bearer tokens.

Si dejás `SUPABASE_JWT_SECRET` vacío, todas las requests caen como anónimas
(útil para arrancar sin auth). Las rutas con `requireAuth` responderán 401.

Para otros IdPs (Auth0, Cognito, AAAS, API keys), reemplazar el verify en
`src/app.ts`. Ver `skill://hono-bun-api/references/auth.md`.

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

- **Unit:** pasar `deps` mockeadas a handlers (ver `test/helpers/`).
- **Integration:** `app.request(url, init)` (in-memory, sin port) + pglite
  para Postgres in-process. Ver `test/helpers/db.ts`.

## CI: typecheck + test + build de una

```bash
bun run check
```

Corre `typecheck → test → build` en orden, aborta al primer fallo. Lo mismo
que correrías en GitHub Actions.

## Build & Docker

```bash
bun run build
bun run dist/server.js

# Imagen ~80MB con Bun multi-stage
docker build -t my-api .
docker run -p 3000:3000 --env-file .env my-api
```
