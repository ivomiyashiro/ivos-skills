import { success, type Result } from '@shared/result';
import type { AppError } from '@shared/errors/app-error';
import type { EventBus } from '@shared/events/event-bus';
import { examples } from '@shared/db/schema';
import type { TransactionManager } from '@shared/db/transaction';
import type { Clock } from '@/di-container';
import type { ExampleDto } from '../../examples.schemas';
import { exampleCreated } from '../../examples.events';

export type CreateExampleCommand = {
  name: string;
  total?: number;
  actorId: string | null;
};

export type CreateExampleDeps = {
  tx: TransactionManager;
  eventBus: EventBus;
  clock: Clock;
};

type ExampleRow = {
  id: string;
  name: string;
  status: ExampleDto['status'];
  total: string;
  createdAt: Date;
  updatedAt: Date;
};

export const toExampleDto = (row: ExampleRow): ExampleDto => ({
  id: row.id,
  name: row.name,
  status: row.status,
  total: Number(row.total),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createExampleCommand = async (
  deps: CreateExampleDeps,
  command: CreateExampleCommand,
): Promise<Result<ExampleDto, AppError>> => {
  const now = deps.clock.now();
  const example = await deps.tx.run(async (db) => {
    const [row] = await db
      .insert(examples)
      .values({
        name: command.name,
        total: String(command.total ?? 0),
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: examples.id,
        name: examples.name,
        status: examples.status,
        total: examples.total,
        createdAt: examples.createdAt,
        updatedAt: examples.updatedAt,
      });

    if (!row) throw new Error('Example insert did not return a row');
    return toExampleDto(row);
  });

  deps.eventBus.publish(exampleCreated(example.id, now));
  return success(example);
};
