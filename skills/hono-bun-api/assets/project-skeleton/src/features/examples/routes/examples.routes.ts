import { createRoute, z } from '@hono/zod-openapi';
import { createApiRouter } from '@shared/hono/router';
import { requireAuth } from '@shared/middlewares/auth';
import type { ExampleUseCasesDeps } from '../use-cases/examples.use-cases';
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
  getExampleController,
  listExamplesController,
  updateExampleController,
} from '../controller/examples.controller';

export const buildExamplesRoutes = (deps: ExampleUseCasesDeps) => {
  const r = createApiRouter();
  const ErrorBody = z.object({ kind: z.string() }).openapi('ErrorBody');
  const ErrorResponses = {
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorBody } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: ErrorBody } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorBody } } },
    409: { description: 'Conflict', content: { 'application/json': { schema: ErrorBody } } },
    422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } },
    500: { description: 'Internal server error', content: { 'application/json': { schema: ErrorBody } } },
  };
  r.use('*', requireAuth);

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
        ...ErrorResponses,
      },
    }),
    createExampleController(deps),
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
        ...ErrorResponses,
      },
    }),
    updateExampleController(deps),
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
        ...ErrorResponses,
      },
    }),
    getExampleController(deps),
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
        ...ErrorResponses,
      },
    }),
    listExamplesController(deps),
  );

  return r;
};
