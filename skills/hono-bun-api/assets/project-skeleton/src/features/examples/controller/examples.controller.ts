import type { Context } from 'hono';
import type { AppEnv } from '@shared/hono/types';
import { toHttpResponse } from '@shared/errors/to-http';
import type { AppContainer } from '@/container';
import { createExampleCommand } from '../use-cases/commands/create-example.command';
import { updateExampleCommand } from '../use-cases/commands/update-example.command';
import { getExampleByIdQuery } from '../use-cases/queries/get-example-by-id.query';
import { listExamplesQuery } from '../use-cases/queries/list-examples.query';
import type { CreateExampleInput, ListExamplesQuery, UpdateExampleInput } from '../examples.schemas';

type ControllerContext = Context<AppEnv, string, any>;
type IdParam = { id: string };

export const createExampleController =
  (container: AppContainer) =>
  async (c: ControllerContext) => {
    const body = c.req.valid('json') as CreateExampleInput;
    const result = await createExampleCommand(
      {
        createRepo: container.createExampleRepository,
        tx: container.tx,
        eventBus: container.eventBus,
        logger: c.get('logger'),
        clock: container.clock,
      },
      {
        ...body,
        actorId: c.get('auth')?.userId ?? null,
      },
    );

    return toHttpResponse(c, result, 201);
  };

export const updateExampleController =
  (container: AppContainer) =>
  async (c: ControllerContext) => {
    const { id } = c.req.valid('param') as IdParam;
    const body = c.req.valid('json') as UpdateExampleInput;
    const result = await updateExampleCommand(
      {
        createRepo: container.createExampleRepository,
        tx: container.tx,
        eventBus: container.eventBus,
        logger: c.get('logger'),
        clock: container.clock,
      },
      {
        id,
        ...body,
        actorId: c.get('auth')?.userId ?? null,
      },
    );

    return toHttpResponse(c, result, 200);
  };

export const getExampleController =
  (container: AppContainer) =>
  async (c: ControllerContext) => {
    const { id } = c.req.valid('param') as IdParam;
    const result = await getExampleByIdQuery(
      { readModel: container.exampleReadModel },
      { id, actorId: c.get('auth')?.userId ?? null },
    );

    return toHttpResponse(c, result, 200);
  };

export const listExamplesController =
  (container: AppContainer) =>
  async (c: ControllerContext) => {
    const query = c.req.valid('query') as ListExamplesQuery;
    const result = await listExamplesQuery(
      { readModel: container.exampleReadModel },
      { ...query, actorId: c.get('auth')?.userId ?? null },
    );

    return toHttpResponse(c, result, 200);
  };
