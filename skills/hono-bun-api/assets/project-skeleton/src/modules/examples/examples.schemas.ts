import { z } from '@hono/zod-openapi';

export const ExampleStatus = z.enum(['draft', 'active', 'archived']);
export type ExampleStatus = z.infer<typeof ExampleStatus>;

export const ExampleDto = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    status: ExampleStatus,
    total: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('ExampleDto');
export type ExampleDto = z.infer<typeof ExampleDto>;

export const CreateExampleInput = z
  .object({
    name: z.string().min(1).max(120),
    total: z.number().nonnegative().optional(),
  })
  .openapi('CreateExampleInput');
export type CreateExampleInput = z.infer<typeof CreateExampleInput>;

export const UpdateExampleInput = z
  .object({
    name: z.string().min(1).max(120).optional(),
    status: ExampleStatus.optional(),
    total: z.number().nonnegative().optional(),
  })
  .openapi('UpdateExampleInput');
export type UpdateExampleInput = z.infer<typeof UpdateExampleInput>;

export const ExampleIdParam = z
  .object({
    id: z.string().uuid().openapi({ param: { name: 'id', in: 'path' } }),
  })
  .openapi('ExampleIdParam');

export const ListExamplesQuery = z
  .object({
    status: ExampleStatus.optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi('ListExamplesQuery');
export type ListExamplesQuery = z.infer<typeof ListExamplesQuery>;

export const ListExamplesResponse = z
  .object({
    items: z.array(ExampleDto),
    nextCursor: z.string().uuid().nullable(),
  })
  .openapi('ListExamplesResponse');
export type ListExamplesResponse = z.infer<typeof ListExamplesResponse>;
