import type { Context } from 'hono';
import type { AppEnv } from '@shared/hono/types';
import { toHttpResponse } from '@shared/errors/to-http';
import { createExampleUseCases, type ExampleUseCasesDeps } from '../use-cases/examples.use-cases';
import type { CreateExampleInput, ListExamplesQuery, UpdateExampleInput } from '../examples.schemas';

type ControllerContext = Context<
  AppEnv,
  string,
  { out: { json: CreateExampleInput | UpdateExampleInput; query: ListExamplesQuery; param: IdParam } }
>;
type IdParam = { id: string };

const buildUseCases = (deps: ExampleUseCasesDeps, c: ControllerContext) =>
  createExampleUseCases({ ...deps, logger: c.get('logger') ?? deps.logger });

export const createExampleController =
  (deps: ExampleUseCasesDeps) =>
  async (c: ControllerContext) => {
    const body = c.req.valid('json') as CreateExampleInput;
    const result = await buildUseCases(deps, c).create({
      ...body,
      ownerId: c.get('auth')!.userId,
    });

    return toHttpResponse(c, result, 201);
  };

export const updateExampleController =
  (deps: ExampleUseCasesDeps) =>
  async (c: ControllerContext) => {
    const { id } = c.req.valid('param') as IdParam;
    const body = c.req.valid('json') as UpdateExampleInput;
    const result = await buildUseCases(deps, c).update({
      id,
      ...body,
      ownerId: c.get('auth')!.userId,
    });

    return toHttpResponse(c, result, 200);
  };

export const getExampleController =
  (deps: ExampleUseCasesDeps) =>
  async (c: ControllerContext) => {
    const { id } = c.req.valid('param') as IdParam;
    const result = await buildUseCases(deps, c).getById({
      id,
      ownerId: c.get('auth')!.userId,
    });

    return toHttpResponse(c, result, 200);
  };

export const listExamplesController =
  (deps: ExampleUseCasesDeps) =>
  async (c: ControllerContext) => {
    const query = c.req.valid('query') as ListExamplesQuery;
    const result = await buildUseCases(deps, c).list({
      ...query,
      ownerId: c.get('auth')!.userId,
    });

    return toHttpResponse(c, result, 200);
  };
