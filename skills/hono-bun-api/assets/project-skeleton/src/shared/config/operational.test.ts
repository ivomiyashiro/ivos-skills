import { describe, expect, test } from 'bun:test';
import { shouldExposeOperationalEndpoint } from './operational';

describe('shouldExposeOperationalEndpoint', () => {
  test('keeps operational endpoints available outside production', () => {
    expect(shouldExposeOperationalEndpoint('development', false)).toBe(true);
  });

  test('requires explicit opt-in in production', () => {
    expect(shouldExposeOperationalEndpoint('production', false)).toBe(false);
    expect(shouldExposeOperationalEndpoint('production', true)).toBe(true);
  });
});
