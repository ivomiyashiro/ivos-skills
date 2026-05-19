import { createRoute, z } from '@hono/zod-openapi';
import { createApiRouter } from '@shared/hono/router';
import { toHttpResponse } from '@shared/errors/to-http';
import type { AppDeps } from '@/app';
import {
  CreateExampleInput,
  UpdateExampleInput,
  ExampleDto,
  ExampleIdParam,
  ListExamplesQuery,
  ListExamplesResponse,
} from './schemas';
import { createExamplesRepo } from './repository';
import { buildExamplesReadContext } from './read-context';
import { createExampleHandler } from './commands/create-example';
import { updateExampleHandler } from './commands/update-example';
import { getExampleByIdHandler } from './queries/get-example-by-id';
import { listExamplesHandler } from './queries/list-examples';

/**
 * buildExampleRoutes — mounteable en app.ts con `.route('/examples', ...)`.
 * Cada handler vive en su archivo; este archivo SOLO compone request→handler→response.
 */
export const buildExampleRoutes = (deps: AppDeps) => {
  const r = createApiRouter();

  const ErrorBody = z.object({ kind: z.string() }).passthrough().openapi('ErrorBody');

  // POST /
  r.openapi(
    createRoute({
      method: 'post',
      path: '/',
      tags: ['examples'],
      summary: 'Crear un example',
      request: {
        body: { content: { 'application/json': { schema: CreateExampleInput } } },
      },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: ExampleDto } } },
        422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } },
      },
    }),
    async (c) => {
      const result = await createExampleHandler(
        {
          repo: createExamplesRepo(c.get('db')),
          eventBus: deps.eventBus,
          logger: c.get('logger'),
          clock: deps.clock,
          userId: c.get('auth')?.userId ?? null,
        },
        c.req.valid('json'),
      );
      return toHttpResponse(c, result, 201);
    },
  );

  // PUT /:id
  r.openapi(
    createRoute({
      method: 'put',
      path: '/{id}',
      tags: ['examples'],
      summary: 'Actualizar un example',
      request: {
        params: ExampleIdParam,
        body: { content: { 'application/json': { schema: UpdateExampleInput } } },
      },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: ExampleDto } } },
        404: { description: 'Not found', content: { 'application/json': { schema: ErrorBody } } },
        422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } },
      },
    }),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const result = await updateExampleHandler(
        {
          repo: createExamplesRepo(c.get('db')),
          eventBus: deps.eventBus,
          logger: c.get('logger'),
          clock: deps.clock,
        },
        { id, input },
      );
      return toHttpResponse(c, result, 200);
    },
  );

  // GET /:id
  r.openapi(
    createRoute({
      method: 'get',
      path: '/{id}',
      tags: ['examples'],
      summary: 'Obtener un example por ID',
      request: { params: ExampleIdParam },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: ExampleDto } } },
        404: { description: 'Not found', content: { 'application/json': { schema: ErrorBody } } },
      },
    }),
    async (c) => {
      const { id } = c.req.valid('param');
      const result = await getExampleByIdHandler(buildExamplesReadContext(c), { id });
      return toHttpResponse(c, result, 200);
    },
  );

  // GET /
  r.openapi(
    createRoute({
      method: 'get',
      path: '/',
      tags: ['examples'],
      summary: 'Listar examples con paginación por cursor',
      request: { query: ListExamplesQuery },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: ListExamplesResponse } } },
        422: { description: 'Validation error', content: { 'application/json': { schema: ErrorBody } } },
      },
    }),
    async (c) => {
      const query = c.req.valid('query');
      const result = await listExamplesHandler(buildExamplesReadContext(c), query);
      return toHttpResponse(c, result, 200);
    },
  );

  return r;
};
