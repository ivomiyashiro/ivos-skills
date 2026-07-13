import type { Example } from '../utils/example.entity';

export interface ExampleRepository {
  findById(id: string, ownerId: string): Promise<Example | null>;
  save(example: Example): Promise<void>;
  delete(id: string, ownerId: string): Promise<void>;
}
