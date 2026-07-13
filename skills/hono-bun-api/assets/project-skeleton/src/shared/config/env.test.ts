import { describe, expect, test } from 'bun:test';
import { parseEnv } from './env';

const required = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
};

describe('parseEnv', () => {
  test('normalizes blank optional Supabase values to undefined', () => {
    const result = parseEnv({
      ...required,
      SUPABASE_URL: '   ',
      SUPABASE_ANON_KEY: '',
      SUPABASE_JWT_SECRET: '  ',
      SUPABASE_SERVICE_ROLE_KEY: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.SUPABASE_URL).toBeUndefined();
      expect(result.data.SUPABASE_JWT_SECRET).toBeUndefined();
    }
  });

  test('requires Supabase URL and JWT secret in production', () => {
    const result = parseEnv({ ...required, NODE_ENV: 'production' });

    expect(result.success).toBe(false);
  });

  test('does not expose a service-role credential to the HTTP process', () => {
    const parsed = parseEnv({
      DATABASE_URL: 'postgresql://localhost:5432/app',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect('SUPABASE_SERVICE_ROLE_KEY' in parsed.data).toBe(false);
    }
  });

  test('requires a Supabase URL whenever JWT verification is configured', () => {
    const parsed = parseEnv({
      DATABASE_URL: 'postgresql://localhost:5432/app',
      SUPABASE_JWT_SECRET: 'this-is-a-long-enough-local-jwt-secret',
    });

    expect(parsed.success).toBe(false);
  });

  test('allows a production JWKS verifier without a shared JWT secret', () => {
    const parsed = parseEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://localhost:5432/app',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_JWKS_URL: 'https://project.supabase.co/auth/v1/.well-known/jwks.json',
    });

    expect(parsed.success).toBe(true);
  });

  test('parses operational hardening settings with safe defaults', () => {
    const result = parseEnv(required);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.REQUEST_BODY_LIMIT_BYTES).toBe(10 * 1024 * 1024);
      expect(result.data.RATE_LIMIT_WINDOW_MS).toBe(60_000);
      expect(result.data.RATE_LIMIT_MAX).toBe(100);
      expect(result.data.RATE_LIMIT_MAX_BUCKETS).toBe(10_000);
      expect(result.data.TRUST_PROXY).toBe(false);
      expect(result.data.EXPOSE_DOCS).toBe(false);
      expect(result.data.EXPOSE_METRICS).toBe(false);
      expect(result.data.DB_POOL_MAX).toBe(20);
      expect(result.data.DB_PREPARE).toBe(true);
      expect(result.data.SUPABASE_TRANSACTION_POOLER).toBe(false);
    }
  });

  test('parses explicit operational settings', () => {
    const result = parseEnv({
      ...required,
      REQUEST_BODY_LIMIT_BYTES: '1048576',
      RATE_LIMIT_WINDOW_MS: '1000',
      RATE_LIMIT_MAX: '10',
      RATE_LIMIT_MAX_BUCKETS: '500',
      TRUST_PROXY: 'true',
      EXPOSE_DOCS: 'true',
      EXPOSE_METRICS: 'true',
      DB_POOL_MAX: '5',
      DB_PREPARE: 'false',
      SUPABASE_TRANSACTION_POOLER: 'true',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.TRUST_PROXY).toBe(true);
      expect(result.data.EXPOSE_DOCS).toBe(true);
      expect(result.data.EXPOSE_METRICS).toBe(true);
      expect(result.data.DB_POOL_MAX).toBe(5);
      expect(result.data.DB_PREPARE).toBe(false);
      expect(result.data.SUPABASE_TRANSACTION_POOLER).toBe(true);
    }
  });
});
