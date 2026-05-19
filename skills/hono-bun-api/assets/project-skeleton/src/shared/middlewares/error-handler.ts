import type { ErrorHandler } from 'hono';
import type { AppEnv } from '@shared/hono/types';

/**
 * Handler global de excepciones no atrapadas. Solo se invoca para errores de
 * PROGRAMADOR (bugs, lib lanzó, panics). Los errores de negocio se manejan vía
 * Result + to-http.ts y nunca llegan acá.
 *
 * Loguea el stack completo pero responde con un payload genérico para no filtrar
 * detalles internos al cliente.
 */
export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const logger = c.get('logger');
  logger?.error(
    {
      err,
      stack: err instanceof Error ? err.stack : undefined,
    },
    'unhandled error',
  );

  return c.json(
    {
      kind: 'Unknown',
      requestId: c.get('requestId'),
    },
    500,
  );
};
