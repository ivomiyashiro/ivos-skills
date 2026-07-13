import type { ExampleStatus } from '../examples.schemas';
import type { ExampleEvent } from './example.events';

export type ExampleProps = {
  id: string;
  ownerId: string;
  name: string;
  status: ExampleStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
};

export class Example {
  private readonly events: ExampleEvent[] = [];

  private constructor(private props: ExampleProps) {}

  static create(input: { name: string; total: number; ownerId: string; now: Date }): Example {
    const example = new Example({
      id: crypto.randomUUID(),
      ownerId: input.ownerId,
      name: input.name,
      status: 'draft',
      total: input.total,
      createdAt: input.now,
      updatedAt: input.now,
    });

    example.events.push({
      type: 'ExampleCreated',
      payload: { id: example.id, name: example.name },
      occurredAt: input.now,
    });

    return example;
  }

  static rehydrate(props: ExampleProps): Example {
    return new Example(props);
  }

  get id() {
    return this.props.id;
  }

  get ownerId() {
    return this.props.ownerId;
  }

  get name() {
    return this.props.name;
  }

  get status() {
    return this.props.status;
  }

  get total() {
    return this.props.total;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: { name?: string; status?: ExampleStatus; total?: number; now: Date }) {
    this.props = {
      ...this.props,
      ...('name' in input && input.name !== undefined ? { name: input.name } : {}),
      ...('status' in input && input.status !== undefined ? { status: input.status } : {}),
      ...('total' in input && input.total !== undefined ? { total: input.total } : {}),
      updatedAt: input.now,
    };

    this.events.push({
      type: 'ExampleUpdated',
      payload: { id: this.id },
      occurredAt: input.now,
    });
  }

  pullEvents(): ExampleEvent[] {
    const events = [...this.events];
    this.events.length = 0;
    return events;
  }
}
