import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { ZodError } from 'zod';
import type { AppEnv } from './types';
import { validation } from '@shared/errors/app-error';

/**
 * Factory para sub-routers tipados (AppEnv) que comparten el defaultHook:
 *
 * - Cualquier fallo de validación Zod (json/query/param) se mapea a 422 con
 *   shape AppError.Validation, uniformando con el resto del Result pattern.
 * - Sin esto, @hono/zod-openapi devuelve 400 con su propio body — incoherente
 *   con AppError.
 *
 * Usar SIEMPRE `createApiRouter()` en lugar de `new OpenAPIHono<AppEnv>()`
 * para que el hook se propague.
 */
type HookResult =
  | { success: true; data: unknown }
  | { success: false; error: ZodError };

export const createApiRouter = () =>
  new OpenAPIHono<AppEnv>({
    defaultHook: (result: HookResult, c: Context<AppEnv>) => {
      if (!result.success) {
        const issues = result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        }));
        return c.json(validation(issues), 422);
      }
    },
  });
