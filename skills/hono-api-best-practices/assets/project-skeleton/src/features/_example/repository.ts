import { eq } from 'drizzle-orm';
import type { Db } from '@shared/db/client';
import { examples, type ExampleRow, type ExampleInsert } from '@shared/db/schema';

/**
 * Repositorio del feature Examples. SOLO escritura (+ load del agregado por ID).
 * Las queries de listado y proyecciones NO viven acá; viven en queries/ con ReadContext.
 */

export type ExamplesRepo = ReturnType<typeof createExamplesRepo>;

export const createExamplesRepo = (db: Db) => ({
  /** Carga el agregado completo. Usar SOLO desde commands que necesiten mutar. */
  findById: async (id: string): Promise<ExampleRow | null> => {
    const rows = await db.select().from(examples).where(eq(examples.id, id)).limit(1);
    return rows[0] ?? null;
  },

  save: async (entity: ExampleInsert): Promise<void> => {
    await db
      .insert(examples)
      .values(entity)
      .onConflictDoUpdate({
        target: examples.id,
        set: {
          name: entity.name,
          status: entity.status,
          total: entity.total,
          updatedAt: new Date(),
        },
      });
  },

  delete: async (id: string): Promise<void> => {
    await db.delete(examples).where(eq(examples.id, id));
  },
});
