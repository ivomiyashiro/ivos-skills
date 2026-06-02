import { pgTable, uuid, text, timestamp, numeric } from 'drizzle-orm/pg-core';

/**
 * Schema de Drizzle compartido entre modulos.
 * Cada modulo puede tener sus tablas; este archivo las re-exporta para que
 * Drizzle Kit las descubra al generar migraciones.
 */

export const examples = pgTable('examples', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: text('status', { enum: ['draft', 'active', 'archived'] }).notNull().default('draft'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ExampleRow = typeof examples.$inferSelect;
export type ExampleInsert = typeof examples.$inferInsert;
