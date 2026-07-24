import { createRoute, z } from '@hono/zod-openapi';
import { createApiRouter } from '@shared/hono/router';
import {
  CreateExampleInput,
  UpdateExampleInput,
  ExampleDto,
  ExampleIdParam,
  ListExamplesQuery,
  ListExamplesResponse,
} from '../examples.schemas';
import {
  createExampleController,
  type ExampleControllerDeps,
  getExampleController,
  listExamplesController,
  updateExampleController,
} from '../controller/examples.controller';

export const buildExamplesRoutes = (deps: ExampleControllerDeps) => {
  const r = createApiRouter();
  const ErrorBody = z.object({ kind: z.string() }).passthrough().openapi('ErrorBody');

  r.openapi(
    createRoute({
      method: 'post',
      path: '/',
      tags: ['examples'],
      summary: 'Create an example',
      request: {
        body: { content: { 'application/json': { schema: CreateExampleInput } } },
      },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: ExampleDto } } },
        422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } },
      },
    }),
    createExampleController(deps) as any,
  );

  r.openapi(
    createRoute({
      method: 'put',
      path: '/{id}',
      tags: ['examples'],
      summary: 'Update an example',
      request: {
        params: ExampleIdParam,
        body: { content: { 'application/json': { schema: UpdateExampleInput } } },
      },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: ExampleDto } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: ErrorBody } } },
        404: { description: 'Not found', content: { 'application/json': { schema: ErrorBody } } },
        422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } },
      },
    }),
    updateExampleController(deps) as any,
  );

  r.openapi(
    createRoute({
      method: 'get',
      path: '/{id}',
      tags: ['examples'],
      summary: 'Get an example by ID',
      request: { params: ExampleIdParam },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: ExampleDto } } },
        404: { description: 'Not found', content: { 'application/json': { schema: ErrorBody } } },
      },
    }),
    getExampleController(deps) as any,
  );

  r.openapi(
    createRoute({
      method: 'get',
      path: '/',
      tags: ['examples'],
      summary: 'List examples with cursor pagination',
      request: { query: ListExamplesQuery },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: ListExamplesResponse } } },
        422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } },
      },
    }),
    listExamplesController(deps) as any,
  );

  return r;
};
