import type { Logger } from 'pino';
import type { Db } from '@shared/db/client';

/**
 * AuthPrincipal — info del usuario autenticado puesta por authMiddleware.
 * null si la ruta es pública o el token no validó.
 */
export type AuthPrincipal = {
  userId: string;
  roles: string[];
  /** Claims extra (free-form para extensión sin romper el contrato base) */
  claims?: Record<string, unknown>;
};

/**
 * Variables tipadas que viven en c.var (per-request).
 * El typing impide acceder a vars no declaradas.
 */
export type AppVars = {
  requestId: string;
  logger: Logger;
  db: Db;
  auth: AuthPrincipal | null;
};

/** AppEnv — pasar a `new Hono<AppEnv>()` y `new OpenAPIHono<AppEnv>()` */
export type AppEnv = {
  Variables: AppVars;
};

/**
 * ReadContext — disponible si una query handler elige recibir db raw.
 * En features grandes, preferir un read model en repository.
 */
export type ReadContext = {
  db: Db;
  logger: Logger;
  auth: AuthPrincipal | null;
};
