import { success, type Result } from '@shared/result';
import type { AppError } from '@shared/errors/app-error';
import type { ExampleReadModel } from '../../repository/example-read-model';
import type { ListExamplesResponse } from '../../examples.schemas';
import type { ListExamplesQuery } from '../../examples.schemas';

export type ListExamplesQueryRequest = ListExamplesQuery & {
  actorId: string | null;
};

export type ListExamplesDeps = {
  readModel: ExampleReadModel;
};

export const listExamplesQuery = async (
  deps: ListExamplesDeps,
  query: ListExamplesQueryRequest,
): Promise<Result<ListExamplesResponse, AppError>> => {
  void query.actorId;
  return success(await deps.readModel.list(query));
};
