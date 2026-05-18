import { and, asc, eq, gt, type SQL } from 'drizzle-orm';
import { success, type Result } from '@shared/result';
import type { AppError } from '@shared/errors/app-error';
import { examples } from '@shared/db/schema';
import type { ExamplesReadContext } from '../read-context';
import type { ListExamplesQuery, ListExamplesResponse } from '../schemas';

/**
 * Query con paginación por cursor (id-based) y filtro opcional por status.
 *
 * El cursor es el id del último item del page anterior. La query trae `limit + 1`
 * para detectar si hay siguiente página sin un count() extra.
 */
export const listExamplesHandler = async (
  ctx: ExamplesReadContext,
  query: ListExamplesQuery,
): Promise<Result<ListExamplesResponse, AppError>> => {
  const conditions: SQL[] = [];
  if (query.status) conditions.push(eq(examples.status, query.status));
  if (query.cursor) conditions.push(gt(examples.id, query.cursor));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await ctx.db
    .select({
      id: examples.id,
      name: examples.name,
      status: examples.status,
      total: examples.total,
      createdAt: examples.createdAt,
      updatedAt: examples.updatedAt,
    })
    .from(examples)
    .where(where)
    .orderBy(asc(examples.id))
    .limit(query.limit + 1);

  const hasMore = rows.length > query.limit;
  const items = (hasMore ? rows.slice(0, query.limit) : rows).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    total: Number(row.total),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return success({ items, nextCursor });
};
