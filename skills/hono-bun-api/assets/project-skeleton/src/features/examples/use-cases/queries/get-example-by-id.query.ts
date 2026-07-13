import { failure, success, type Result } from '@shared/result';
import { notFound, type AppError } from '@shared/errors/app-error';
import type { ExampleReadModel } from '../examples.use-cases';
import type { ExampleDto } from '../../examples.schemas';

export type GetExampleByIdQuery = {
  id: string;
  ownerId: string;
};

export type GetExampleByIdDeps = {
  readModel: ExampleReadModel;
};

export const getExampleByIdQuery = async (
  deps: GetExampleByIdDeps,
  query: GetExampleByIdQuery,
): Promise<Result<ExampleDto, AppError>> => {
  const example = await deps.readModel.getById(query.id, query.ownerId);
  if (!example) return failure(notFound('Example', query.id));

  return success(example);
};
