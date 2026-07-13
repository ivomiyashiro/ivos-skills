import { describe, expect, test } from 'bun:test';
import { createEventBus } from './event-bus';

describe('event bus', () => {
  test('awaits asynchronous handlers before publish resolves', async () => {
    const bus = createEventBus();
    let handled = false;
    bus.on('ExampleCreated', async () => {
      await Bun.sleep(1);
      handled = true;
    });

    await bus.publish({ type: 'ExampleCreated', payload: {}, occurredAt: new Date() });

    expect(handled).toBe(true);
  });

  test('contains rejected handler errors', async () => {
    const bus = createEventBus();
    const error = new Error('subscriber failed');
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args) => calls.push(args);
    bus.on('ExampleCreated', async () => {
      throw error;
    });

    await expect(bus.publish({ type: 'ExampleCreated', payload: {}, occurredAt: new Date() })).resolves.toBeUndefined();

    console.error = originalError;
    expect(calls).toEqual([['event handler failed', error]]);
  });
});
