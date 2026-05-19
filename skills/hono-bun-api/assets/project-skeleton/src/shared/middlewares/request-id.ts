import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '@shared/hono/types';

/**
 * Middleware request-id: respeta el header X-Request-Id entrante si existe,
 * sino genera uno. Lo expone en c.var.requestId y en el header de respuesta.
 *
 * Debe ir PRIMERO en la cadena para que el logger child pueda usarlo.
 */
export const requestId = (): MiddlewareHandler<AppEnv> => async (c, next) => {
  const incoming = c.req.header('x-request-id');
  const id = incoming && incoming.length <= 128 ? incoming : crypto.randomUUID();
  c.set('requestId', id);
  c.header('x-request-id', id);
  await next();
};
