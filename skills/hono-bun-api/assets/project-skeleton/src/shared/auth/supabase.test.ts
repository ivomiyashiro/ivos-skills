import { describe, expect, test } from 'bun:test';
import { SignJWT } from 'jose';
import { createSupabaseVerify } from './supabase';

const secret = 'this-is-a-test-secret-that-is-long-enough';
const issuer = 'https://project.supabase.co/auth/v1';
const audience = 'authenticated';

const signToken = async (input: {
  algorithm?: 'HS256' | 'HS512';
  issuer?: string;
  audience?: string;
  role?: string;
}) =>
  new SignJWT({ role: input.role ?? 'authenticated' })
    .setProtectedHeader({ alg: input.algorithm ?? 'HS256' })
    .setSubject('80fe1521-dfa7-46c2-9ca8-791828047d6b')
    .setIssuer(input.issuer ?? issuer)
    .setAudience(input.audience ?? audience)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));

describe('createSupabaseVerify', () => {
  const verify = createSupabaseVerify({
    mode: 'hs256',
    jwtSecret: secret,
    issuer,
    audience,
    role: 'authenticated',
  });

  test('accepts only tokens with the configured algorithm and Supabase claims', async () => {
    expect(await verify(await signToken({}))).toMatchObject({
      userId: '80fe1521-dfa7-46c2-9ca8-791828047d6b',
      roles: ['authenticated'],
    });
    expect(await verify(await signToken({ algorithm: 'HS512' }))).toBeNull();
    expect(await verify(await signToken({ issuer: 'https://other.supabase.co/auth/v1' }))).toBeNull();
    expect(await verify(await signToken({ audience: 'other' }))).toBeNull();
    expect(await verify(await signToken({ role: 'service_role' }))).toBeNull();
  });
});
