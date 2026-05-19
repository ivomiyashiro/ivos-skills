import { eq } from 'drizzle-orm';
import { success, failure, type Result } from '@shared/result';
import { notFound, type AppError } from '@shared/errors/app-error';
import { examples } from '@shared/db/schema';
import type { ExamplesReadContext } from '../read-context';
import type { ExampleDto } from '../schemas';

/**
 * Query: lee directo de la DB usando ctx.db. No usa el repo.
 * Si necesitás joins, agregalos acá; no rompas la simetría con el lado de escritura.
 */
export const getExampleByIdHandler = async (
  ctx: ExamplesReadContext,
  { id }: { id: string },
): Promise<Result<ExampleDto, AppError>> => {
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
    .where(eq(examples.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return failure(notFound('Example', id));

  return success({
    id: row.id,
    name: row.name,
    status: row.status,
    total: Number(row.total),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
};
