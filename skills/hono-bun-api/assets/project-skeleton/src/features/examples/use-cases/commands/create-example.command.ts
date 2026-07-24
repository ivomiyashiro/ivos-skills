import { success, type Result } from '@shared/result';
import type { AppError } from '@shared/errors/app-error';
import type { Logger } from '@shared/observability/logger';
import type { EventBus } from '@shared/events/event-bus';
import type { Clock } from '@/di-container';
import type { Db } from '@shared/db/client';
import type { TransactionManager } from '@shared/db/transaction';
import type { ExampleRepository } from '../../repository/example.repository';
import { Example } from '../../utils/example.entity';
import type { ExampleDto } from '../../examples.schemas';

export type CreateExampleCommand = {
  name: string;
  total?: number;
  actorId: string | null;
};

export type CreateExampleDeps = {
  createRepo: (db: Db) => ExampleRepository;
  tx: TransactionManager;
  eventBus: EventBus;
  logger: Logger;
  clock: Clock;
};

export const createExampleCommand = async (
  deps: CreateExampleDeps,
  command: CreateExampleCommand,
): Promise<Result<ExampleDto, AppError>> => {
  const now = deps.clock.now();
  const example = Example.create({
    name: command.name,
    total: command.total ?? 0,
    now,
  });

  await deps.tx.run(async (db) => {
    await deps.createRepo(db).save(example);
  });

  deps.eventBus.publishMany(example.pullEvents());
  deps.logger.info({ id: example.id, actorId: command.actorId }, 'example created');

  return success({
    id: example.id,
    name: example.name,
    status: example.status,
    total: example.total,
    createdAt: example.createdAt.toISOString(),
    updatedAt: example.updatedAt.toISOString(),
  });
};
