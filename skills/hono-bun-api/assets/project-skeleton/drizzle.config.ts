import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: Bun.env.DATABASE_URL ?? 'postgresql://localhost:5432/app',
  },
  verbose: true,
  strict: true,
});
