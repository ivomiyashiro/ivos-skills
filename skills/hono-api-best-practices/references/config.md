# Configuration

## Principios

1. **Single source of truth:** `env.ts` con Zod.
2. **Fail fast:** validar al boot, no en función. Si falta una var, el proceso no arranca.
3. **Sin JSON config files.** Bun + `.env` cubre todo lo que `appsettings.{Env}.json`
   hacía en .NET.
4. **`.env.example` checked-in.** `.env` con valores reales en `.gitignore`.

## env.ts

```ts
// shared/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  SHUTDOWN_GRACE_MS: z.coerce.number().int().nonnegative().default(2_000),
});

const parsed = envSchema.safeParse(Bun.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
```

**Importante:** el `parse` es **top-level** (módulo). Importar `env` causa el parse
automáticamente. Si falla, el proceso muere antes de servir requests.

## .env.example

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
LOG_LEVEL=info
REQUEST_TIMEOUT_MS=30000
SHUTDOWN_GRACE_MS=2000
```

Commit `.env.example`, no `.env`. Documenta cada var con un comentario si su
propósito no es obvio.

## Cargar `.env` en Bun

Bun lee `.env` automáticamente:
- `.env` — siempre
- `.env.local` — siempre, override de `.env`
- `.env.{NODE_ENV}` — según `NODE_ENV`
- `.env.{NODE_ENV}.local` — idem, override

Precedencia (mayor a menor):
1. `process.env` (sistema, docker, k8s)
2. `.env.{NODE_ENV}.local`
3. `.env.local`
4. `.env.{NODE_ENV}`
5. `.env`

## Multi-environment

Configuración por entorno:

```
.env                 # defaults compartidos
.env.development     # overrides para dev
.env.test            # overrides para test (DB efímera, etc.)
.env.production      # NO commiteado — viene de secrets manager
```

## Tipos derivados

```ts
import { env } from '@shared/config/env';

env.PORT;           // number
env.DATABASE_URL;   // string (validated URL)
env.LOG_LEVEL;      // 'fatal' | 'error' | ...
```

TypeScript chequea uso correcto. Renombrar una var en el schema rompe los call sites.

## Secrets

**Nunca** loguear `env.DATABASE_URL` u otros secrets. Pino redact:

```ts
pino({
  redact: ['env.DATABASE_URL', 'env.JWT_SECRET', '*.password'],
});
```

O exponer parcialmente:

```ts
logger.info({ port: env.PORT }, 'starting');
// NO: logger.info({ env }, 'starting');
```

## Feature flags vía env

```ts
const envSchema = z.object({
  // ...
  FEATURE_X_ENABLED: z.coerce.boolean().default(false),
});

// uso
if (env.FEATURE_X_ENABLED) {
  app.route('/x', buildXRoutes(deps));
}
```

Para flags más complejos (rollout %, per-user), usar un servicio dedicado
(LaunchDarkly, GrowthBook, custom).

## Runtime config reload (opcional)

Por default, `env` se lee una vez al boot. Si querés reload:

```ts
let envCache = envSchema.parse(Bun.env);
export const getEnv = () => envCache;
export const reloadEnv = () => { envCache = envSchema.parse(Bun.env); };
```

Y exponer `/admin/reload-config` (protegido). En general, **no lo necesitás**;
restart en deploy es más simple.

## Anti-patrones

- ❌ Validar env dentro de una función (`function getDb() { const url = z.parse(...) }`).
  Si la var falta, el error aparece tarde, no al boot.
- ❌ `Bun.env.SOME_VAR ?? 'fallback'` directo en código sin pasar por env.ts.
  Pierde tipos y validation.
- ❌ JSON config files para datos que cambian por entorno. Usar env.
- ❌ Commitear `.env` con secrets reales. Solo `.env.example`.
- ❌ Logear `env` completo al startup. Filtrar.
