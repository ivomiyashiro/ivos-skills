import type { Db } from '@shared/db/client';
import type { TransactionManager } from '@shared/db/transaction';
import type { EventBus } from '@shared/events/event-bus';
import type { Logger } from '@shared/observability/logger';
import type { Clock } from '@/container';
import type { ExampleRepository } from '../repository/example.repository';
import type { ExampleReadModel } from '../repository/example-read-model';
import {
  createExampleCommand,
  type CreateExampleCommand,
} from './commands/create-example.command';
import {
  updateExampleCommand,
  type UpdateExampleCommand,
} from './commands/update-example.command';
import {
  getExampleByIdQuery,
  type GetExampleByIdQuery,
} from './queries/get-example-by-id.query';
import {
  listExamplesQuery,
  type ListExamplesQueryRequest,
} from './queries/list-examples.query';

export type ExampleUseCasesDeps = {
  createRepo: (db: Db) => ExampleRepository;
  readModel: ExampleReadModel;
  tx: TransactionManager;
  eventBus: EventBus;
  logger: Logger;
  clock: Clock;
};

export const createExampleUseCases = (deps: ExampleUseCasesDeps) => ({
  create: (command: CreateExampleCommand) => createExampleCommand(deps, command),
  update: (command: UpdateExampleCommand) => updateExampleCommand(deps, command),
  getById: (query: GetExampleByIdQuery) =>
    getExampleByIdQuery({ readModel: deps.readModel }, query),
  list: (query: ListExamplesQueryRequest) =>
    listExamplesQuery({ readModel: deps.readModel }, query),
});
