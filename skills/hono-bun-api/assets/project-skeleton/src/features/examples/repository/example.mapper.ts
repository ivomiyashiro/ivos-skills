import type { ExampleInsert, ExampleRow } from '@shared/db/schema';
import { Example } from '../utils/example.entity';

export const ExampleMapper = {
  toDomain(row: ExampleRow): Example {
    return Example.rehydrate({
      id: row.id,
      name: row.name,
      status: row.status,
      total: Number(row.total),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(example: Example): ExampleInsert {
    return {
      id: example.id,
      name: example.name,
      status: example.status,
      total: String(example.total),
      createdAt: example.createdAt,
      updatedAt: example.updatedAt,
    };
  },
};
