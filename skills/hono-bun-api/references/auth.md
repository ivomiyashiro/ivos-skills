# Auth: Supabase como default + slot extensible

## Filosofía

El skill provee un **slot tipado** (`VerifyFn`) y middlewares genéricos
(`authMiddleware`, `requireAuth`, `requireRole`). El **default opinado es
Supabase Auth** porque cubre el 90% de los casos sin escribir IdP propio. Para
JWT genérico, mTLS, API gateway interno o API keys, el mismo slot acepta cualquier
`verify` que retorne `AuthPrincipal | null`.

## Piezas base

```ts
// shared/hono/types.ts
export type AuthPrincipal = {
  userId: string;
  roles: string[];
  claims?: Record<string, unknown>;
};

// shared/middlewares/auth.ts
export type VerifyFn = (token: string) => Promise<AuthPrincipal | null>;

export const authMiddleware = (verify: VerifyFn): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const header = c.req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    c.set('auth', token ? await verify(token) : null);
    await next();
  };

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get('auth')) return c.json({ kind: 'Unauthorized' }, 401);
  await next();
};

export const requireRole = (role: string): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const auth = c.get('auth');
    if (!auth) return c.json({ kind: 'Unauthorized' }, 401);
    if (!auth.roles.includes(role)) {
      return c.json({ kind: 'Forbidden', reason: `missing role: ${role}` }, 403);
    }
    await next();
  };
```

---

## Supabase Auth (default)

### 1. Instalar dependencias

```bash
bun add jose
# Opcional, si querés además invocar la Admin API:
bun add @supabase/supabase-js
```

`jose` es el único requerido para verificar tokens; el SDK de Supabase solo hace
falta para operaciones admin (revocar, listar usuarios, etc.).

### 2. Variables de entorno

```dotenv
# .env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_JWT_SECRET=tu-jwt-secret-de-dashboard
# Opcional para roles administrativos (NUNCA en el cliente):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

`SUPABASE_JWT_SECRET` está en Dashboard → Project Settings → API → JWT Settings.

### 3. Schema env.ts

```ts
const envSchema = z.object({
  // ...
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(32),
});
```

### 4. Verify factory

El skeleton incluye `src/shared/auth/supabase.ts` con `createSupabaseVerify`:

```ts
import { createSupabaseVerify } from '@shared/auth/supabase';

const verify = createSupabaseVerify({
  mode: 'hs256',
  jwtSecret: env.SUPABASE_JWT_SECRET,
  issuer: `${env.SUPABASE_URL}/auth/v1`,
});
```

Modo asimétrico (rotación de keys sin reissuing de secrets):

```ts
const verify = createSupabaseVerify({
  mode: 'jwks',
  jwksUri: `${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  issuer: `${env.SUPABASE_URL}/auth/v1`,
});
```

### 5. Mountear en app.ts

```ts
import { authMiddleware } from '@shared/middlewares/auth';
import { createSupabaseVerify } from '@shared/auth/supabase';
import { env } from '@shared/config/env';

const verify = createSupabaseVerify({
  mode: 'hs256',
  jwtSecret: env.SUPABASE_JWT_SECRET,
});

app.use('*', authMiddleware(verify));
```

### Mapping de claims de Supabase

| Supabase claim | AuthPrincipal | Notas |
|---|---|---|
| `sub` | `userId` | UUID del usuario en `auth.users`. |
| `app_metadata.roles` (array) | `roles` | Custom roles que pongas vía Admin API. |
| `app_metadata.role` (string) | `roles` (singleton) | Fallback si guardás un solo rol. |
| `role` ('authenticated' / 'anon') | NO va a `roles` | Es el rol Postgres para RLS, no rol de app. |
| Todo el payload | `claims` | Por si necesitás `email`, `aud`, etc. |

Para asignar roles custom al usuario (desde un servicio admin o trigger Postgres):

```ts
import { createClient } from '@supabase/supabase-js';

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
await admin.auth.admin.updateUserById(userId, {
  app_metadata: { roles: ['admin', 'billing'] },
});
```

### Rutas privadas por default

```ts
const r = new OpenAPIHono<AppEnv>();
r.use('*', requireAuth);

r.openapi(createOrderSpec, async (c) => {
  const userId = c.get('auth')!.userId;
  // ...
});

const adminRouter = new OpenAPIHono<AppEnv>();
adminRouter.use('*', requireAuth, requireRole('admin'));
```

Cada feature debe montar `requireAuth` como default. Declarar una ruta pública de
forma explícita y documentar por qué lo es; no dejarla pública porque el fixture
de test todavía no tiene token. `requireRole` puede rechazar temprano permisos
gruesos, pero no reemplaza la autorización de recursos en el use case.

### OpenAPI security scheme

```ts
app.openAPIRegistry.registerComponent('securitySchemes', 'SupabaseBearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Supabase access token (sb-access-token)',
});

const spec = createRoute({
  // ...
  security: [{ SupabaseBearer: [] }],
});
```

Scalar muestra "Authorize" para probar con token.

### Combinar con RLS (opcional)

Si **además** de Supabase Auth usás Supabase como DB y querés RLS:

1. Mantené el `DATABASE_URL` apuntando a Supabase Postgres con un rol
   least-privileged sujeto a RLS.
2. Después de verificar el JWT, pasá los claims verificados al server Postgres
   dentro de una transacción. `SET LOCAL` evita que el contexto quede en el pool:

```ts
// shared/db/with-rls.ts
import { sql } from 'drizzle-orm';
import type { Db } from './client';
import type { AuthPrincipal } from '../hono/types';

export const withRlsContext = async <T>(
  db: Db,
  principal: AuthPrincipal,
  fn: (tx: Db) => Promise<T>,
): Promise<T> =>
  db.transaction(async (tx) => {
    await tx.execute(sql`
      select set_config('request.jwt.claim.sub', ${principal.userId}, true)
    `);
    await tx.execute(sql`
      select set_config('request.jwt.claim.role', 'authenticated', true)
    `);
    return fn(tx as Db);
  });
```

No decodifiques ni reenvíes un JWT sin verificar: `principal` debe provenir de
`VerifyFn`. RLS es defensa en profundidad, útil también para clientes directos a
PostgREST; la autorización de negocio sigue en el use case o policy. RLS no tiene
efecto si la conexión directa a Postgres usa un superuser o un rol con
`BYPASSRLS`. `SUPABASE_SERVICE_ROLE_KEY` también bypassa RLS en las APIs de
Supabase, por lo que debe quedar en jobs/admin workers separados del tráfico de
usuarios.

---

## Alternativa: JWT genérico con jose (otros IdPs)

Para Auth0, Cognito, Keycloak, o un IdP custom con JWKS pública:

```ts
import { jwtVerify, createRemoteJWKSet } from 'jose';

const jwks = createRemoteJWKSet(new URL(env.JWKS_URI));

export const verifyJwt: VerifyFn = async (token) => {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    return {
      userId: payload.sub!,
      roles: (payload.roles as string[]) ?? [],
      claims: payload as Record<string, unknown>,
    };
  } catch {
    return null;
  }
};

app.use('*', authMiddleware(verifyJwt));
```

---

## Alternativa: AAAS / API Gateway interno

```ts
export const verifyAAAS: VerifyFn = async (token) => {
  const res = await fetch(`${env.AAAS_URL}/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { userId: data.userId, roles: data.roles, claims: data };
};
```

Cachear con TTL corto si el volumen lo justifica.

## Alternativa: API Keys

```ts
export const verifyApiKey: VerifyFn = async (key) => {
  const apiKey = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.key, key))
    .then((r) => r[0]);
  if (!apiKey || apiKey.revokedAt) return null;
  return {
    userId: apiKey.ownerId,
    roles: ['api'],
    claims: { keyId: apiKey.id },
  };
};
```

Pega contra DB en cada request. Cachear con TTL si volumen alto.

## Composición de verifys

JWT + API key en headers separados:

```ts
const verify: VerifyFn = async (_token) => null; // unused
app.use('*', async (c, next) => {
  const apiKey = c.req.header('x-api-key');
  if (apiKey) {
    c.set('auth', await verifyApiKey(apiKey));
    return next();
  }
  const bearer = c.req.header('authorization')?.replace(/^Bearer /, '');
  c.set('auth', bearer ? await verifySupabase(bearer) : null);
  await next();
});
```

---

## Authorization fina en el use case

`requireRole` es coarse-grained. Para "¿este usuario puede editar este recurso?",
el controller pasa el actor y el use case decide:

```ts
export const updateX = async (deps, input) => {
  const x = await deps.repo.findById(input.id);
  if (!x) return failure(notFound('X', input.id));
  if (x.ownerId !== input.actor.userId) return failure(forbidden('not owner'));
  // ...
};
```

## Anti-patrones

- ❌ Verificar JWT manualmente en cada handler. Que el middleware lo haga una vez.
- ❌ Decidir ownership o permisos de negocio en el handler. Pasar el principal al
  use case y decidirlo allí o en una policy pura.
- ❌ `throw` en `verify` para tokens inválidos. Return `null`; el middleware decide
  401.
- ❌ Filtrar info del principal en el response body (`{ ...auth }`). Devolver solo
  lo necesario.
- ❌ Roles en código: `if (user.role === 'admin')`. Usar `auth.roles.includes('admin')`
  o `requireRole('admin')`.
- ❌ Usar `SUPABASE_SERVICE_ROLE_KEY` en el proceso que sirve tráfico user-facing.
  El service-role bypassa RLS; mantenelo en jobs admin separados.
- ❌ Loguear el access token completo. Es PII + credencial.
