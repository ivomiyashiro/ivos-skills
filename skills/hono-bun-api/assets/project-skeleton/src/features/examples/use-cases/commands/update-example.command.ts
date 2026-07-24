import { eq } from 'drizzle-orm';
import { failure, success, type Result } from '@shared/result';
import { forbidden, notFound, type AppError } from '@shared/errors/app-error';
import type { EventBus } from '@shared/events/event-bus';
import { examples } from '@shared/db/schema';
import type { TransactionManager } from '@shared/db/transaction';
import type { Clock } from '@/di-container';
import type { ExampleDto, ExampleStatus } from '../../examples.schemas';
import { exampleUpdated } from '../../examples.events';

export type UpdateExampleCommand = {
  id: string;
  name?: string;
  status?: ExampleStatus;
  total?: number;
  actorId: string | null;
};

export type UpdateExampleDeps = {
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

const toExampleDto = (row: ExampleRow): ExampleDto => ({
  id: row.id,
  name: row.name,
  status: row.status,
  total: Number(row.total),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const updateExampleCommand = async (
  deps: UpdateExampleDeps,
  command: UpdateExampleCommand,
): Promise<Result<ExampleDto, AppError>> => {
  if (!command.actorId) return failure(forbidden('Authentication is required to update an example'));

  const now = deps.clock.now();
  const example = await deps.tx.run(async (db) => {
    const [row] = await db
      .update(examples)
      .set({
        ...(command.name !== undefined && { name: command.name }),
        ...(command.status !== undefined && { status: command.status }),
        ...(command.total !== undefined && { total: String(command.total) }),
        updatedAt: now,
      })
      .where(eq(examples.id, command.id))
      .returning({
        id: examples.id,
        name: examples.name,
        status: examples.status,
        total: examples.total,
        createdAt: examples.createdAt,
        updatedAt: examples.updatedAt,
      });

    return row ? toExampleDto(row) : null;
  });

  if (!example) return failure(notFound('Example', command.id));

  deps.eventBus.publish(exampleUpdated(example.id, now));
  return success(example);
};
