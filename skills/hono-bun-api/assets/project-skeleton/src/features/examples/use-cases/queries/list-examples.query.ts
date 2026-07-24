import { and, asc, eq, gt } from 'drizzle-orm';
import { success, type Result } from '@shared/result';
import type { AppError } from '@shared/errors/app-error';
import type { Db } from '@shared/db/client';
import { examples } from '@shared/db/schema';
import type { ExampleDto, ListExamplesQuery, ListExamplesResponse } from '../../examples.schemas';

export type ListExamplesQueryRequest = ListExamplesQuery & { actorId: string | null };
export type ListExamplesDeps = { db: Db };

type ExampleRow = {
  id: string;
  name: string;
  status: ExampleDto['status'];
  total: string;
  createdAt: Date;
  updatedAt: Date;
};

const toExampleDto = (row: ExampleRow): ExampleDto => ({
  id: row.id,
  name: row.name,
  status: row.status,
  total: Number(row.total),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const listExamplesQuery = async (
  deps: ListExamplesDeps,
  query: ListExamplesQueryRequest,
): Promise<Result<ListExamplesResponse, AppError>> => {
  const rows = await deps.db
    .select({
      id: examples.id,
      name: examples.name,
      status: examples.status,
      total: examples.total,
      createdAt: examples.createdAt,
      updatedAt: examples.updatedAt,
    })
    .from(examples)
    .where(
      and(
        query.status ? eq(examples.status, query.status) : undefined,
        query.cursor ? gt(examples.id, query.cursor) : undefined,
      ),
    )
    .orderBy(asc(examples.id))
    .limit(query.limit + 1);

  const hasMore = rows.length > query.limit;
  const items = (hasMore ? rows.slice(0, query.limit) : rows).map(toExampleDto);
  return success({ items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null });
};
