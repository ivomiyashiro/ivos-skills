import type { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import type { AppEnv } from '@shared/hono/types';

/**
 * Monta /openapi.json (spec) y /docs (Scalar UI). Llamar después de registrar todas
 * las rutas para que el registry tenga todo.
 */
export const mountDocs = (app: OpenAPIHono<AppEnv>) => {
  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'API',
      version: '0.1.0',
      description: 'API generada con hono-bun-api skill',
    },
  });

  app.get(
    '/docs',
    apiReference({
      spec: { url: '/openapi.json' },
      theme: 'default',
    }),
  );
};
