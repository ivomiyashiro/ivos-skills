import { afterEach, describe, expect, test } from 'bun:test';
import { buildTestDb } from '@test/helpers/db';
import { DrizzleExampleRepository } from './drizzle-example.repository';
import { ExampleReadModel } from './example-read-model';
import { Example } from '../utils/example.entity';
import { createExampleUseCases } from '../use-cases/examples.use-cases';
import { createTransactionManager } from '@shared/db/transaction';
import { noopBus, silentLogger, fixedClock } from '@test/helpers';

const ownerId = '80fe1521-dfa7-46c2-9ca8-791828047d6b';
const otherOwnerId = '453bf551-33f8-41bf-aad3-b80fd035d8f2';

describe('example ownership', () => {
  const databases: Array<Awaited<ReturnType<typeof buildTestDb>>> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map(({ close }) => close()));
  });

  test('does not list examples owned by another user', async () => {
    const testDb = await buildTestDb();
    databases.push(testDb);
    const repo = new DrizzleExampleRepository(testDb.db);
    const readModel = new ExampleReadModel(testDb.db);
    const example = Example.create({
      name: 'Private example',
      total: 0,
      ownerId,
      now: new Date('2026-05-12T00:00:00Z'),
    });

    await repo.save(example);

    await expect(readModel.list({ ownerId: otherOwnerId, limit: 10 })).resolves.toMatchObject({
      items: [],
    });
  });

  test('does not read or update an example owned by another user', async () => {
    const testDb = await buildTestDb();
    databases.push(testDb);
    const repo = new DrizzleExampleRepository(testDb.db);
    const readModel = new ExampleReadModel(testDb.db);
    const example = Example.create({
      name: 'Private example',
      total: 0,
      ownerId,
      now: new Date('2026-05-12T00:00:00Z'),
    });
    await repo.save(example);
    const useCases = createExampleUseCases({
      createExampleRepository: (db) => new DrizzleExampleRepository(db),
      exampleReadModel: readModel,
      tx: createTransactionManager(testDb.db),
      eventBus: noopBus,
      logger: silentLogger,
      clock: fixedClock(),
    });

    await expect(readModel.getById(example.id, otherOwnerId)).resolves.toBeNull();
    await expect(useCases.update({ id: example.id, name: 'Changed', ownerId: otherOwnerId })).resolves.toMatchObject({
      ok: false,
      error: { kind: 'NotFound' },
    });
  });
});
