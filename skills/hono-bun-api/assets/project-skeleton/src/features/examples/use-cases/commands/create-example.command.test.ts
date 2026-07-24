import { expect, test } from 'bun:test';
import { toExampleDto } from './create-example.command';

test('toExampleDto converts the database numeric value', () => {
  expect(
    toExampleDto({
      id: 'fbc67e68-6af2-44d3-8ec2-5f357bc5c3d4',
      name: 'Example',
      status: 'draft',
      total: '12.50',
      createdAt: new Date('2026-05-12T00:00:00Z'),
      updatedAt: new Date('2026-05-12T01:00:00Z'),
    }),
  ).toMatchObject({ total: 12.5, status: 'draft' });
});
