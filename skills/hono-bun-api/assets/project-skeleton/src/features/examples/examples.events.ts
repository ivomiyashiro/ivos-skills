import type { DomainEvent } from '@shared/events/event-bus';

export const exampleCreated = (exampleId: string, occurredAt: Date): DomainEvent<'example.created', { exampleId: string }> => ({
  type: 'example.created',
  payload: { exampleId },
  occurredAt,
});

export const exampleUpdated = (exampleId: string, occurredAt: Date): DomainEvent<'example.updated', { exampleId: string }> => ({
  type: 'example.updated',
  payload: { exampleId },
  occurredAt,
});
