import { createRoute, z } from '@hono/zod-openapi';
import { createApiRouter } from '@shared/hono/router';
import { toHttpResponse } from '@shared/errors/to-http';
import type { Db } from '@shared/db/client';
import type { TransactionManager } from '@shared/db/transaction';
import type { EventBus } from '@shared/events/event-bus';
import type { Clock } from '@/di-container';
import {
  CreateExampleInput,
  ExampleDto,
  ExampleIdParam,
  ListExamplesQuery,
  ListExamplesResponse,
  UpdateExampleInput,
} from './examples.schemas';
import { createExampleCommand } from './use-cases/commands/create-example.command';
import { updateExampleCommand } from './use-cases/commands/update-example.command';
import { getExampleByIdQuery } from './use-cases/queries/get-example-by-id.query';
import { listExamplesQuery } from './use-cases/queries/list-examples.query';

export type ExamplesRouteDeps = {
  db: Db;
  tx: TransactionManager;
  eventBus: EventBus;
  clock: Clock;
};

export const buildExamplesRoutes = (deps: ExamplesRouteDeps) => {
  const routes = createApiRouter();
  const ErrorBody = z.object({ kind: z.string() }).passthrough().openapi('ErrorBody');

  routes.openapi(
    createRoute({
      method: 'post', path: '/', tags: ['examples'], summary: 'Create an example',
      request: { body: { content: { 'application/json': { schema: CreateExampleInput } } } },
      responses: { 201: { description: 'Created', content: { 'application/json': { schema: ExampleDto } } }, 422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } } },
    }),
    async (c) => toHttpResponse(c, await createExampleCommand(deps, { ...c.req.valid('json'), actorId: c.get('auth')?.userId ?? null }), 201),
  );

  routes.openapi(
    createRoute({
      method: 'put', path: '/{id}', tags: ['examples'], summary: 'Update an example',
      request: { params: ExampleIdParam, body: { content: { 'application/json': { schema: UpdateExampleInput } } } },
      responses: { 200: { description: 'Updated', content: { 'application/json': { schema: ExampleDto } } }, 403: { description: 'Forbidden', content: { 'application/json': { schema: ErrorBody } } }, 404: { description: 'Not found', content: { 'application/json': { schema: ErrorBody } } }, 422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } } },
    }),
    async (c) => toHttpResponse(c, await updateExampleCommand(deps, { id: c.req.valid('param').id, ...c.req.valid('json'), actorId: c.get('auth')?.userId ?? null }), 200),
  );

  routes.openapi(
    createRoute({
      method: 'get', path: '/{id}', tags: ['examples'], summary: 'Get an example by ID', request: { params: ExampleIdParam },
      responses: { 200: { description: 'OK', content: { 'application/json': { schema: ExampleDto } } }, 404: { description: 'Not found', content: { 'application/json': { schema: ErrorBody } } } },
    }),
    async (c) => toHttpResponse(c, await getExampleByIdQuery({ db: deps.db }, { id: c.req.valid('param').id, actorId: c.get('auth')?.userId ?? null }), 200),
  );

  routes.openapi(
    createRoute({
      method: 'get', path: '/', tags: ['examples'], summary: 'List examples with cursor pagination', request: { query: ListExamplesQuery },
      responses: { 200: { description: 'OK', content: { 'application/json': { schema: ListExamplesResponse } } }, 422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } } },
    }),
    async (c) => toHttpResponse(c, await listExamplesQuery({ db: deps.db }, { ...c.req.valid('query'), actorId: c.get('auth')?.userId ?? null }), 200),
  );

  return routes;
};
