import type { ExampleStatus } from '../../examples.schemas';

export type UpdateExampleCommand = {
  id: string;
  name?: string;
  status?: ExampleStatus;
  total?: number;
  actorId: string | null;
};
