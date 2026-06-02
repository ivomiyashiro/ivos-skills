import { success, type Result } from '@shared/result';
import type { AppError } from '@shared/errors/app-error';
import type { ExampleReadModel } from '../../infrastructure/example-read-model';
import type { ListExamplesResponse } from '../../examples.schemas';
import type { ListExamplesQueryRequest } from '../queries/list-examples.query';

export type ListExamplesDeps = {
  readModel: ExampleReadModel;
};

export const listExamplesHandler = async (
  deps: ListExamplesDeps,
  query: ListExamplesQueryRequest,
): Promise<Result<ListExamplesResponse, AppError>> => {
  void query.actorId;
  return success(await deps.readModel.list(query));
};
