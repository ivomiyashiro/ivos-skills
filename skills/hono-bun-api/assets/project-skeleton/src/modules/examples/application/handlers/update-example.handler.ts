import { failure, success, type Result } from '@shared/result';
import { forbidden, notFound, type AppError } from '@shared/errors/app-error';
import type { Logger } from '@shared/observability/logger';
import type { EventBus } from '@shared/events/event-bus';
import type { Clock } from '@/container';
import type { Db } from '@shared/db/client';
import type { TransactionManager } from '@shared/db/transaction';
import type { ExampleRepository } from '../../domain/example.repository';
import { canUpdateExample } from '../../domain/example.policies';
import type { ExampleDto } from '../../examples.schemas';
import type { UpdateExampleCommand } from '../commands/update-example.command';

export type UpdateExampleDeps = {
  createRepo: (db: Db) => ExampleRepository;
  tx: TransactionManager;
  eventBus: EventBus;
  logger: Logger;
  clock: Clock;
};

export const updateExampleHandler = async (
  deps: UpdateExampleDeps,
  command: UpdateExampleCommand,
): Promise<Result<ExampleDto, AppError>> => {
  const decision = canUpdateExample(command.actorId);
  if (!decision.allowed) return failure(forbidden(decision.reason));

  const updated = await deps.tx.run(async (db) => {
    const repo = deps.createRepo(db);
    const example = await repo.findById(command.id);
    if (!example) return null;

    example.update({
      name: command.name,
      status: command.status,
      total: command.total,
      now: deps.clock.now(),
    });

    await repo.save(example);
    return example;
  });

  if (!updated) return failure(notFound('Example', command.id));

  deps.eventBus.publishMany(updated.pullEvents());
  deps.logger.info({ id: updated.id, actorId: command.actorId }, 'example updated');

  return success({
    id: updated.id,
    name: updated.name,
    status: updated.status,
    total: updated.total,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
};
