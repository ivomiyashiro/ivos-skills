import { success, type Result } from '@shared/result';
import type { AppError } from '@shared/errors/app-error';
import type { Logger } from '@shared/observability/logger';
import type { EventBus } from '@shared/events/event-bus';
import type { Clock } from '@/container';
import type { Db } from '@shared/db/client';
import type { TransactionManager } from '@shared/db/transaction';
import type { ExampleRepository } from '../../domain/example.repository';
import { Example } from '../../domain/example.entity';
import type { ExampleDto } from '../../examples.schemas';
import type { CreateExampleCommand } from '../commands/create-example.command';

export type CreateExampleDeps = {
  createRepo: (db: Db) => ExampleRepository;
  tx: TransactionManager;
  eventBus: EventBus;
  logger: Logger;
  clock: Clock;
};

export const createExampleHandler = async (
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
