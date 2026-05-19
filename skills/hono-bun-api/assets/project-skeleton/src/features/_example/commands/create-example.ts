import { success, type Result } from '@shared/result';
import { type AppError } from '@shared/errors/app-error';
import type { Logger } from '@shared/observability/logger';
import type { EventBus, DomainEvent } from '@shared/events/event-bus';
import type { Clock } from '@/app';
import type { ExamplesRepo } from '../repository';
import type { CreateExampleInput, ExampleDto } from '../schemas';
import type { ExampleCreated } from '../events';

export type CreateExampleDeps = {
  repo: ExamplesRepo;
  eventBus: EventBus;
  logger: Logger;
  clock: Clock;
  userId: string | null;
};

/**
 * Handler del comando CreateExample.
 * - Genera ID
 * - Persiste vía repo.save()
 * - Emite evento ExampleCreated post-persistencia
 * - Retorna el DTO completo
 */
export const createExampleHandler = async (
  deps: CreateExampleDeps,
  input: CreateExampleInput,
): Promise<Result<ExampleDto, AppError>> => {
  const now = deps.clock.now();
  const id = crypto.randomUUID();

  await deps.repo.save({
    id,
    name: input.name,
    status: 'draft',
    total: String(input.total ?? 0),
    createdAt: now,
    updatedAt: now,
  });

  const event: ExampleCreated = {
    type: 'ExampleCreated',
    payload: { id, name: input.name },
    occurredAt: now,
  };
  deps.eventBus.publish(event satisfies DomainEvent);

  deps.logger.info({ id, name: input.name }, 'example created');

  return success({
    id,
    name: input.name,
    status: 'draft',
    total: input.total ?? 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
};
