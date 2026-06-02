import { failure, success, type Result } from '@shared/result';
import { notFound, type AppError } from '@shared/errors/app-error';
import type { ExampleReadModel } from '../../infrastructure/example-read-model';
import type { ExampleDto } from '../../examples.schemas';
import type { GetExampleByIdQuery } from '../queries/get-example-by-id.query';

export type GetExampleByIdDeps = {
  readModel: ExampleReadModel;
};

export const getExampleByIdHandler = async (
  deps: GetExampleByIdDeps,
  query: GetExampleByIdQuery,
): Promise<Result<ExampleDto, AppError>> => {
  void query.actorId;

  const example = await deps.readModel.getById(query.id);
  if (!example) return failure(notFound('Example', query.id));

  return success(example);
};
