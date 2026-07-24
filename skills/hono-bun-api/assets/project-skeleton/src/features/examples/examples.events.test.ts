import { expect, test } from 'bun:test';
import { exampleCreated } from './examples.events';

test('exampleCreated identifies the created example', () => {
  const occurredAt = new Date('2026-05-12T00:00:00Z');

  expect(exampleCreated('fbc67e68-6af2-44d3-8ec2-5f357bc5c3d4', occurredAt)).toEqual({
    type: 'example.created',
    payload: { exampleId: 'fbc67e68-6af2-44d3-8ec2-5f357bc5c3d4' },
    occurredAt,
  });
});
