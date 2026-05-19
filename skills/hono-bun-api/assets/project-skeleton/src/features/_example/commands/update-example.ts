import { success, failure, type Result } from '@shared/result';
import { notFound, type AppError } from '@shared/errors/app-error';
import type { Logger } from '@shared/observability/logger';
import type { EventBus } from '@shared/events/event-bus';
import type { Clock } from '@/app';
import type { ExamplesRepo } from '../repository';
import type { UpdateExampleInput, ExampleDto } from '../schemas';
import type { ExampleUpdated } from '../events';

export type UpdateExampleDeps = {
  repo: ExamplesRepo;
  eventBus: EventBus;
  logger: Logger;
  clock: Clock;
};

/**
 * Patrón load → mutate → save. Si el agregado no existe → NotFound.
 * Emite ExampleUpdated solo después de persistir exitosamente.
 */
export const updateExampleHandler = async (
  deps: UpdateExampleDeps,
  { id, input }: { id: string; input: UpdateExampleInput },
): Promise<Result<ExampleDto, AppError>> => {
  const current = await deps.repo.findById(id);
  if (!current) return failure(notFound('Example', id));

  const now = deps.clock.now();
  const next = {
    ...current,
    name: input.name ?? current.name,
    status: input.status ?? current.status,
    total: input.total !== undefined ? String(input.total) : current.total,
    updatedAt: now,
  };

  await deps.repo.save(next);

  const event: ExampleUpdated = {
    type: 'ExampleUpdated',
    payload: { id, changes: input },
    occurredAt: now,
  };
  deps.eventBus.publish(event);

  return success({
    id: next.id,
    name: next.name,
    status: next.status,
    total: Number(next.total),
    createdAt: next.createdAt.toISOString(),
    updatedAt: next.updatedAt.toISOString(),
  });
};
