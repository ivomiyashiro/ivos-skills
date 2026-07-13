import { describe, expect, test } from 'bun:test';
import { resolveDbClientOptions } from './client';

describe('resolveDbClientOptions', () => {
  test('uses the configured pool limit and prepared statement setting', () => {
    expect(resolveDbClientOptions({ poolMax: 5, prepare: false, transactionPooler: false })).toEqual({
      max: 5,
      prepare: false,
    });
  });

  test('disables prepared statements for a Supabase transaction pooler', () => {
    expect(resolveDbClientOptions({ poolMax: 5, prepare: true, transactionPooler: true })).toEqual({
      max: 5,
      prepare: false,
    });
  });
});
