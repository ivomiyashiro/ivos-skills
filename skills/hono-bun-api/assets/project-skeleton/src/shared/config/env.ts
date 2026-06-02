import { z } from 'zod';

/**
 * Schema de variables de entorno. Validado al boot (top-level), no en función.
 * Si falta una var crítica, la app crashea al startup — fail fast.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  SHUTDOWN_GRACE_MS: z.coerce.number().int().nonnegative().default(2_000),

  // Supabase Auth — opcionales para permitir bootstrap sin auth.
  // Si SUPABASE_JWT_SECRET está set, app.ts conecta createSupabaseVerify automáticamente.
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(32).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(Bun.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
