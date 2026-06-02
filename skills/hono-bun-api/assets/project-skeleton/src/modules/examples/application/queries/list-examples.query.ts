import type { ListExamplesQuery } from '../../examples.schemas';

export type ListExamplesQueryRequest = ListExamplesQuery & {
  actorId: string | null;
};
