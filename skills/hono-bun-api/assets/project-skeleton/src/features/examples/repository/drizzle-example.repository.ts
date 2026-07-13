import { and, eq } from 'drizzle-orm';
import type { Db } from '@shared/db/client';
import { examples } from '@shared/db/schema';
import type { ExampleRepository } from './example.repository';
import type { Example } from '../utils/example.entity';
import { ExampleMapper } from './example.mapper';

export class DrizzleExampleRepository implements ExampleRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string, ownerId: string): Promise<Example | null> {
    const rows = await this.db
      .select()
      .from(examples)
      .where(and(eq(examples.id, id), eq(examples.ownerId, ownerId)))
      .limit(1);
    return rows[0] ? ExampleMapper.toDomain(rows[0]) : null;
  }

  async save(example: Example): Promise<void> {
    const row = ExampleMapper.toPersistence(example);

    await this.db
      .insert(examples)
      .values(row)
      .onConflictDoUpdate({
        target: examples.id,
        set: {
          name: row.name,
          status: row.status,
          total: row.total,
          updatedAt: row.updatedAt,
        },
      });
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await this.db.delete(examples).where(and(eq(examples.id, id), eq(examples.ownerId, ownerId)));
  }
}
