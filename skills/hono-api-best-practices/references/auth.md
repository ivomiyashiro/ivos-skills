# Auth: slot extensible

## Filosofía

El skill **no decide** cómo validás tokens. Provee un slot tipado y middlewares
genéricos. Vos conectás JWT, sesión, AAAS, mTLS, lo que sea.

## Pieces

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

## Uso típico

```ts
// app.ts
import { authMiddleware, requireAuth, requireRole } from '@shared/middlewares/auth';

const verify = buildVerifyFn(/* config */);
app.use('*', authMiddleware(verify));

// Rutas públicas — c.var.auth puede ser null, las protegidas requieren middleware.
app.get('/healthz', (c) => c.json({ status: 'ok' }));

// Rutas privadas
const r = new OpenAPIHono<AppEnv>();
r.use('*', requireAuth);
r.openapi(createOrderSpec, async (c) => {
  const userId = c.get('auth')!.userId;
  // ...
});

// Solo admins
const adminRouter = new OpenAPIHono<AppEnv>();
adminRouter.use('*', requireAuth, requireRole('admin'));
```

## Ejemplo: JWT con jose

```bash
bun add jose
```

```ts
// shared/auth/jwt.ts
import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { VerifyFn, AuthPrincipal } from '@shared/middlewares/auth';

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
      claims: payload,
    };
  } catch {
    return null;  // token inválido/expirado → null, no throw
  }
};

// app.ts
app.use('*', authMiddleware(verifyJwt));
```

## Ejemplo: AAAS / ApiGateway (interno)

```ts
// shared/auth/aaas.ts
export const verifyAAAS: VerifyFn = async (token) => {
  const res = await fetch(`${env.AAAS_URL}/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    userId: data.userId,
    roles: data.roles,
    claims: data,
  };
};
```

(Cachear esta validación con TTL corto si el volumen lo justifica.)

## API Keys

```ts
export const verifyApiKey: VerifyFn = async (key) => {
  const apiKey = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).then(r => r[0]);
  if (!apiKey || apiKey.revokedAt) return null;
  return {
    userId: apiKey.ownerId,
    roles: ['api'],
    claims: { keyId: apiKey.id },
  };
};
```

Notar que esto pega contra DB en cada request. Cachear con TTL si volumen alto.

## Composición de verifys

Si soportás múltiples métodos (JWT + API key):

```ts
const verify: VerifyFn = async (token) => {
  if (token.startsWith('apikey_')) return verifyApiKey(token.slice(7));
  return verifyJwt(token);
};
```

O usá headers diferentes:

```ts
app.use('*', async (c, next) => {
  const auth = await tryVerify(c);
  c.set('auth', auth);
  await next();
});

const tryVerify = async (c) => {
  const apiKey = c.req.header('x-api-key');
  if (apiKey) return verifyApiKey(apiKey);

  const bearer = c.req.header('authorization')?.replace(/^Bearer /, '');
  if (bearer) return verifyJwt(bearer);

  return null;
};
```

## OpenAPI security schemes

```ts
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// En la ruta
const spec = createRoute({
  // ...
  security: [{ Bearer: [] }],
});
```

Scalar muestra el botón "Authorize" para probar con token.

## Authorization en el handler (fino)

`requireRole` es coarse-grained (basado en roles globales). Para "puede este usuario
editar este recurso?", el handler decide:

```ts
export const updateXHandler = async (deps, input) => {
  const x = await deps.repo.findById(input.id);
  if (!x) return failure(notFound('X', input.id));
  if (x.ownerId !== deps.userId) return failure(forbidden('not owner'));
  // ...
};
```

## Anti-patrones

- ❌ Verificar JWT manualmente en cada handler. Que el middleware lo haga una vez.
- ❌ Storage de tokens en `c.var` además de `auth`. Innecesario.
- ❌ `throw` en `verify` para tokens inválidos. Return `null`; el middleware decide
  401.
- ❌ Filtrar info del principal en el response body (`{ ...auth }`). Devolver solo
  lo necesario.
- ❌ Roles en código: `if (user.role === 'admin')`. Usar `auth.roles.includes('admin')`
  o `requireRole('admin')`.
