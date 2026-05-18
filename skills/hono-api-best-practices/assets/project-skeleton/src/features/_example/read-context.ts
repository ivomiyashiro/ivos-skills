import type { Context } from 'hono';
import type { AppEnv, ReadContext } from '@shared/hono/types';

/**
 * ExamplesReadContext — generalmente igual a ReadContext, pero acá podés agregar
 * deps específicas del feature (cache, search index, etc.) sin tocar shared.
 */
export type ExamplesReadContext = ReadContext;

/** Builder: extrae lo necesario de c.var. */
export const buildExamplesReadContext = (c: Context<AppEnv>): ExamplesReadContext => ({
  db: c.get('db'),
  logger: c.get('logger'),
  auth: c.get('auth'),
});
