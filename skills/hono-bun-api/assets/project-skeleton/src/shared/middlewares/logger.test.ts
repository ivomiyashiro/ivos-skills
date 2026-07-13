import { describe, expect, test } from 'bun:test';
import { metricRouteLabel } from './logger';

describe('metricRouteLabel', () => {
  test('uses a bounded label for unmatched requests', () => {
    expect(metricRouteLabel(undefined)).toBe('unmatched');
  });

  test('preserves the matched route pattern', () => {
    expect(metricRouteLabel('/examples/:id')).toBe('/examples/:id');
  });
});
