import type { Example } from './example.entity';

export interface ExampleRepository {
  findById(id: string): Promise<Example | null>;
  save(example: Example): Promise<void>;
  delete(id: string): Promise<void>;
}
