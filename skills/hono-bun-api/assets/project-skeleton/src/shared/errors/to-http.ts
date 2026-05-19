import type { Context } from 'hono';
import type { Result } from '@shared/result';
import type { AppError } from './app-error';
import type { AppEnv } from '@shared/hono/types';

type StatusCode = 200 | 201 | 204;

/**
 * Mapea un Result al response HTTP correspondiente. Switch exhaustivo sobre kind.
 * Si el caller no pasa successStatus, default 200.
 */
export const toHttpResponse = <T>(
  c: Context<AppEnv>,
  result: Result<T, AppError>,
  successStatus: StatusCode = 200,
) => {
  if (result.ok) {
    if (successStatus === 204) return c.body(null, 204);
    return c.json(result.value as object, successStatus);
  }

  const err = result.error;
  c.get('logger')?.warn({ err }, 'app error');

  switch (err.kind) {
    case 'NotFound':
      return c.json({ kind: err.kind, resource: err.resource, id: err.id }, 404);
    case 'Unauthorized':
      return c.json({ kind: err.kind, reason: err.reason }, 401);
    case 'Forbidden':
      return c.json({ kind: err.kind, reason: err.reason }, 403);
    case 'Validation':
      return c.json({ kind: err.kind, issues: err.issues }, 422);
    case 'Conflict':
      return c.json({ kind: err.kind, reason: err.reason }, 409);
    case 'Unknown':
      return c.json({ kind: err.kind }, 500);
  }
};
