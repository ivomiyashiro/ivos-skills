import { and, asc, eq, gt } from 'drizzle-orm';
import type { Db } from '@shared/db/client';
import { examples } from '@shared/db/schema';
import type { ExampleDto, ListExamplesQuery, ListExamplesResponse } from '../examples.schemas';

export class ExampleReadModel {
  constructor(private readonly db: Db) {}

  async getById(id: string): Promise<ExampleDto | null> {
    const rows = await this.db
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

    return rows[0] ? this.toDto(rows[0]) : null;
  }

  async list(input: ListExamplesQuery): Promise<ListExamplesResponse> {
    const rows = await this.db
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
          input.status ? eq(examples.status, input.status) : undefined,
          input.cursor ? gt(examples.id, input.cursor) : undefined,
        ),
      )
      .orderBy(asc(examples.id))
      .limit(input.limit + 1);

    const hasMore = rows.length > input.limit;
    const items = (hasMore ? rows.slice(0, input.limit) : rows).map((row) => this.toDto(row));

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }

  private toDto(row: {
    id: string;
    name: string;
    status: ExampleDto['status'];
    total: string;
    createdAt: Date;
    updatedAt: Date;
  }): ExampleDto {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      total: Number(row.total),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
