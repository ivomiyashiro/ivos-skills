/**
 * Test setup global. Cargado por bunfig.toml [test].preload.
 *
 * Preload corre ANTES de cargar test files, así que estos env vars
 * llegan a env.ts antes de su parse top-level (que crashea si falta DATABASE_URL).
 *
 * Configure timezone, locale, or test-only environment defaults here.
 */

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'silent';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:54329/app_test';
