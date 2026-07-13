import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workspaces: string[] = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { recursive: true, force: true })));
});

describe('scaffold-feature', () => {
  test('generates a self-contained, authenticated feature slice', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'hono-feature-'));
    workspaces.push(workspace);
    const script = new URL('./scaffold-feature.ts', import.meta.url).pathname;

    const scaffold = Bun.spawnSync({
      cmd: ['bun', script, 'order-item'],
      cwd: workspace,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    expect(scaffold.exitCode).toBe(0);

    const featureRoot = join(workspace, 'src/features/order-items');
    const [routes, dependencies, routeTest, repository, readModel] = await Promise.all([
      readFile(join(featureRoot, 'routes/order-items.routes.ts'), 'utf8'),
      readFile(join(featureRoot, 'use-cases/order-items.use-cases.ts'), 'utf8'),
      readFile(join(featureRoot, 'routes/order-items.routes.test.ts'), 'utf8'),
      readFile(join(featureRoot, 'repository/drizzle-order-item.repository.ts'), 'utf8'),
      readFile(join(featureRoot, 'repository/order-item-read-model.ts'), 'utf8'),
    ]);

    expect(dependencies).toContain('export type OrderItemUseCasesDeps');
    expect(routes).toContain('deps: OrderItemUseCasesDeps');
    expect(routes).toContain("r.use('*', requireAuth);");
    expect(routes).not.toContain('AppContainer');
    expect(routeTest).toContain('new Hono<AppEnv>()');
    expect(routeTest).toContain('buildOrderItemsRoutes(deps)');
    expect(routeTest).toContain('expect(anonymous.status).toBe(401)');
    expect(routeTest).toContain('expect(authenticated.status).toBe(200)');
    expect(repository).not.toContain("@shared/db/schema");
    expect(repository).toContain('throw new Error');
    expect(readModel).not.toContain("@shared/db/schema");
    expect(readModel).toContain('throw new Error');
  });
});
