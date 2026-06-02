import type { DomainEvent } from '@shared/events/event-bus';

export type ExampleCreated = DomainEvent<'ExampleCreated', { id: string; name: string }>;
export type ExampleUpdated = DomainEvent<'ExampleUpdated', { id: string }>;

export type ExampleEvent = ExampleCreated | ExampleUpdated;
