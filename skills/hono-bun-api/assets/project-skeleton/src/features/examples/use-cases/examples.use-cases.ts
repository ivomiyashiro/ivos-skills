import type { Db } from '@shared/db/client';
import type { TransactionManager } from '@shared/db/transaction';
import type { EventBus } from '@shared/events/event-bus';
import type { Logger } from '@shared/observability/logger';
import type { ExampleRepository } from '../repository/example.repository';
import type { ExampleDto, ListExamplesQuery, ListExamplesResponse } from '../examples.schemas';
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

export type ExampleClock = { now: () => Date };

export type ExampleReadModel = {
  getById(id: string, ownerId: string): Promise<ExampleDto | null>;
  list(input: ListExamplesQuery & { ownerId: string }): Promise<ListExamplesResponse>;
};

export type ExampleUseCasesDeps = {
  createExampleRepository: (db: Db) => ExampleRepository;
  exampleReadModel: ExampleReadModel;
  tx: TransactionManager;
  eventBus: EventBus;
  logger: Logger;
  clock: ExampleClock;
};

export const createExampleUseCases = (deps: ExampleUseCasesDeps) => ({
  create: (command: CreateExampleCommand) =>
    createExampleCommand({ ...deps, createRepo: deps.createExampleRepository }, command),
  update: (command: UpdateExampleCommand) =>
    updateExampleCommand({ ...deps, createRepo: deps.createExampleRepository }, command),
  getById: (query: GetExampleByIdQuery) =>
    getExampleByIdQuery({ readModel: deps.exampleReadModel }, query),
  list: (query: ListExamplesQueryRequest) =>
    listExamplesQuery({ readModel: deps.exampleReadModel }, query),
});
