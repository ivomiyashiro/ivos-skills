import type { Context } from 'hono';
import type { AppEnv } from '@shared/hono/types';
import { toHttpResponse } from '@shared/errors/to-http';
import type { AppContainer } from '@/container';
import { createExampleUseCases } from '../use-cases/examples.use-cases';
import type { CreateExampleInput, ListExamplesQuery, UpdateExampleInput } from '../examples.schemas';

type ControllerContext = Context<AppEnv, string, any>;
type IdParam = { id: string };

const buildUseCases = (container: AppContainer, c: ControllerContext) =>
  createExampleUseCases({
    createRepo: container.createExampleRepository,
    readModel: container.exampleReadModel,
    tx: container.tx,
    eventBus: container.eventBus,
    logger: c.get('logger'),
    clock: container.clock,
  });

export const createExampleController =
  (container: AppContainer) =>
  async (c: ControllerContext) => {
    const body = c.req.valid('json') as CreateExampleInput;
    const result = await buildUseCases(container, c).create({
      ...body,
      actorId: c.get('auth')?.userId ?? null,
    });

    return toHttpResponse(c, result, 201);
  };

export const updateExampleController =
  (container: AppContainer) =>
  async (c: ControllerContext) => {
    const { id } = c.req.valid('param') as IdParam;
    const body = c.req.valid('json') as UpdateExampleInput;
    const result = await buildUseCases(container, c).update({
      id,
      ...body,
      actorId: c.get('auth')?.userId ?? null,
    });

    return toHttpResponse(c, result, 200);
  };

export const getExampleController =
  (container: AppContainer) =>
  async (c: ControllerContext) => {
    const { id } = c.req.valid('param') as IdParam;
    const result = await buildUseCases(container, c).getById({
      id,
      actorId: c.get('auth')?.userId ?? null,
    });

    return toHttpResponse(c, result, 200);
  };

export const listExamplesController =
  (container: AppContainer) =>
  async (c: ControllerContext) => {
    const query = c.req.valid('query') as ListExamplesQuery;
    const result = await buildUseCases(container, c).list({
      ...query,
      actorId: c.get('auth')?.userId ?? null,
    });

    return toHttpResponse(c, result, 200);
  };
