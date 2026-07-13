import { z } from 'zod';

/**
 * Schema de variables de entorno. Validado al boot (top-level), no en función.
 * Si falta una var crítica, la app crashea al startup — fail fast.
 */
const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), schema.optional());

const booleanFromEnv = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    if (value.trim().toLowerCase() === 'true') return true;
    if (value.trim().toLowerCase() === 'false') return false;
    return value;
  }, z.boolean().default(defaultValue));

const envSchema = z
  .object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
   LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
   REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
   REQUEST_BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
   SHUTDOWN_GRACE_MS: z.coerce.number().int().nonnegative().default(2_000),
   RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
   RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
   RATE_LIMIT_MAX_BUCKETS: z.coerce.number().int().positive().default(10_000),
   TRUST_PROXY: booleanFromEnv(false),
   EXPOSE_DOCS: booleanFromEnv(false),
   EXPOSE_METRICS: booleanFromEnv(false),
   DB_POOL_MAX: z.coerce.number().int().positive().default(20),
   DB_PREPARE: booleanFromEnv(true),
   SUPABASE_TRANSACTION_POOLER: booleanFromEnv(false),

   // Supabase Auth — opcionales para permitir bootstrap sin auth.
  // Si SUPABASE_JWT_SECRET está set, app.ts conecta createSupabaseVerify automáticamente.
    SUPABASE_URL: optionalString(z.string().url()),
    SUPABASE_ANON_KEY: optionalString(z.string().min(1)),
    SUPABASE_JWT_SECRET: optionalString(z.string().min(32)),
    SUPABASE_JWKS_URL: optionalString(z.string().url()),
  })
  .superRefine((value, ctx) => {
    const hasVerifier = Boolean(value.SUPABASE_JWT_SECRET || value.SUPABASE_JWKS_URL);
    if (hasVerifier && !value.SUPABASE_URL) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['SUPABASE_URL'], message: 'is required when JWT verification is configured' });
    }
    if (value.NODE_ENV === 'production' && !hasVerifier) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['SUPABASE_JWKS_URL'], message: 'a JWT verifier is required in production' });
    }
  });

export const parseEnv = (input: unknown) => envSchema.safeParse(input);

const parsed = parseEnv(Bun.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
