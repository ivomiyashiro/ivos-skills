/**
 * Test setup global. Cargado por bunfig.toml [test].preload.
 *
 * Preload corre ANTES de cargar test files, así que estos env vars
 * llegan a env.ts antes de su parse top-level (que crashea si falta DATABASE_URL).
 *
 * Acá podés:
 *  - Configurar timezone, locale.
 *  - Levantar PGlite o un contenedor Postgres cuando el caso lo necesite.
 *  - Hacer reset de DB entre tests.
 */

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'silent';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
