import { eq } from 'drizzle-orm';
import { failure, success, type Result } from '@shared/result';
import { notFound, type AppError } from '@shared/errors/app-error';
import type { Db } from '@shared/db/client';
import { examples } from '@shared/db/schema';
import type { ExampleDto } from '../../examples.schemas';

export type GetExampleByIdQuery = { id: string; actorId: string | null };
export type GetExampleByIdDeps = { db: Db };

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

export const getExampleByIdQuery = async (
  deps: GetExampleByIdDeps,
  query: GetExampleByIdQuery,
): Promise<Result<ExampleDto, AppError>> => {
  const [row] = await deps.db
    .select({
      id: examples.id,
      name: examples.name,
      status: examples.status,
      total: examples.total,
      createdAt: examples.createdAt,
      updatedAt: examples.updatedAt,
    })
    .from(examples)
    .where(eq(examples.id, query.id))
    .limit(1);

  return row ? success(toExampleDto(row)) : failure(notFound('Example', query.id));
};
