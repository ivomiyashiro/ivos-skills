import type { MiddlewareHandler } from 'hono';
import type { AppEnv, AuthPrincipal } from '@shared/hono/types';

/**
 * Slot de autenticación. No casa a un IdP concreto — el caller pasa `verify`,
 * una función que toma el token raw y retorna el principal o null.
 *
 * Default del skeleton: Supabase (ver shared/auth/supabase.ts). Para otros IdPs
 * (Auth0, Cognito, AAAS, API keys), ver references/auth.md.
 *
 * Uso típico en app.ts:
 *   app.use('*', authMiddleware(createSupabaseVerify({ mode: 'hs256', jwtSecret })));
 *
 * Las rutas protegidas usan requireAuth() después.
 */
export type VerifyFn = (token: string) => Promise<AuthPrincipal | null>;

export const authMiddleware = (verify: VerifyFn): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const header = c.req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    c.set('auth', token ? await verify(token) : null);
    await next();
  };

/** Bloquea la ruta si no hay principal autenticado. 401 si falta. */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get('auth')) {
    return c.json({ kind: 'Unauthorized' }, 401);
  }
  await next();
};

/** Factory: bloquea la ruta si el principal no tiene el rol. 403 si no lo tiene. */
export const requireRole = (role: string): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const auth = c.get('auth');
    if (!auth) return c.json({ kind: 'Unauthorized' }, 401);
    if (!auth.roles.includes(role)) return c.json({ kind: 'Forbidden', reason: `missing role: ${role}` }, 403);
    await next();
  };
