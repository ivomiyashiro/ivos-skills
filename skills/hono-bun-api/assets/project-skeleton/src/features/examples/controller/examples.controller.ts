import type { Context } from 'hono';
import type { AppEnv } from '@shared/hono/types';
import { toHttpResponse } from '@shared/errors/to-http';
import {
  createExampleUseCases,
  type ExampleUseCasesDeps,
} from '../use-cases/examples.use-cases';
import type { CreateExampleInput, ListExamplesQuery, UpdateExampleInput } from '../examples.schemas';

type ControllerContext = Context<AppEnv, string, any>;
type IdParam = { id: string };

export type ExampleControllerDeps = Omit<ExampleUseCasesDeps, 'logger'>;

const buildUseCases = (deps: ExampleControllerDeps, c: ControllerContext) =>
  createExampleUseCases({
    ...deps,
    logger: c.get('logger'),
  });

export const createExampleController =
  (deps: ExampleControllerDeps) =>
  async (c: ControllerContext) => {
    const body = c.req.valid('json') as CreateExampleInput;
    const result = await buildUseCases(deps, c).create({
      ...body,
      actorId: c.get('auth')?.userId ?? null,
    });

    return toHttpResponse(c, result, 201);
  };

export const updateExampleController =
  (deps: ExampleControllerDeps) =>
  async (c: ControllerContext) => {
    const { id } = c.req.valid('param') as IdParam;
    const body = c.req.valid('json') as UpdateExampleInput;
    const result = await buildUseCases(deps, c).update({
      id,
      ...body,
      actorId: c.get('auth')?.userId ?? null,
    });

    return toHttpResponse(c, result, 200);
  };

export const getExampleController =
  (deps: ExampleControllerDeps) =>
  async (c: ControllerContext) => {
    const { id } = c.req.valid('param') as IdParam;
    const result = await buildUseCases(deps, c).getById({
      id,
      actorId: c.get('auth')?.userId ?? null,
    });

    return toHttpResponse(c, result, 200);
  };

export const listExamplesController =
  (deps: ExampleControllerDeps) =>
  async (c: ControllerContext) => {
    const query = c.req.valid('query') as ListExamplesQuery;
    const result = await buildUseCases(deps, c).list({
      ...query,
      actorId: c.get('auth')?.userId ?? null,
    });

    return toHttpResponse(c, result, 200);
  };
