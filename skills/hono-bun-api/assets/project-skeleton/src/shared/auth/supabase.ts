import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { AuthPrincipal } from '@shared/hono/types';
import type { VerifyFn } from '@shared/middlewares/auth';

/**
 * Verify factory para tokens emitidos por Supabase Auth.
 *
 * Modo HS256 (default): valida con el JWT secret compartido del proyecto
 *   (Dashboard → Project Settings → API → JWT Secret). Cero remote calls.
 *
 * Modo JWKS (asimétrico): cuando Supabase usa keys rotables (RS256), pasá la
 *   URL de JWKS en lugar del secret.
 *
 * Payload esperado de Supabase:
 *   - sub: user id (uuid)
 *   - role: 'authenticated' | 'anon' | 'service_role'
 *   - app_metadata: { roles?: string[]; provider?: string; ... }
 *   - user_metadata: free-form
 */

export type SupabaseVerifyOptions =
  | { mode: 'hs256'; jwtSecret: string; issuer: string; audience: string; role: string }
  | { mode: 'jwks'; jwksUri: string; issuer: string; audience: string; role: string };

export const createSupabaseVerify = (opts: SupabaseVerifyOptions): VerifyFn => {
  const keyFn =
    opts.mode === 'hs256'
      ? new TextEncoder().encode(opts.jwtSecret)
      : createRemoteJWKSet(new URL(opts.jwksUri));

  const verifyOpts = {
    algorithms: opts.mode === 'hs256' ? ['HS256'] : ['RS256', 'ES256'],
    issuer: opts.issuer,
    audience: opts.audience,
  };

  return async (token: string): Promise<AuthPrincipal | null> => {
    try {
      const { payload } = await jwtVerify(token, keyFn as never, verifyOpts);
      if (!payload.sub || payload.role !== opts.role) return null;

      const appMetadata = (payload.app_metadata ?? {}) as {
        roles?: string[];
        role?: string;
      };
      const roles =
        appMetadata.roles ??
        (appMetadata.role ? [appMetadata.role] : [payload.role]);

      return {
        userId: payload.sub,
        roles: roles.filter((role): role is string => typeof role === 'string'),
        claims: payload as Record<string, unknown>,
      };
    } catch {
      return null;
    }
  };
};
