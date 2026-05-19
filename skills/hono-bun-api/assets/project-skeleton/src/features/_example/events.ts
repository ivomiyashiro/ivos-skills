import type { DomainEvent } from '@shared/events/event-bus';

/**
 * Domain events del feature Examples. Cada uno extiende DomainEvent con un
 * `type` discriminante y un payload tipado.
 *
 * Los commands los acumulan en una lista local y los publican post-commit
 * via deps.eventBus.publishMany().
 */

export type ExampleCreated = DomainEvent<
  'ExampleCreated',
  { id: string; name: string }
>;

export type ExampleUpdated = DomainEvent<
  'ExampleUpdated',
  { id: string; changes: Partial<{ name: string; status: string; total: number }> }
>;

export type ExampleEvent = ExampleCreated | ExampleUpdated;
