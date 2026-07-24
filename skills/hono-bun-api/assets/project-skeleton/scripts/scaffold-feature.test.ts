import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workspaces: string[] = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { recursive: true })));
});

describe('scaffold-feature', () => {
  test('generates a flat feature with operation-local database access', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'hono-bun-api-scaffold-'));
    workspaces.push(workspace);
    const script = join(import.meta.dir, 'scaffold-feature.ts');

    const process = Bun.spawn({ cmd: ['bun', 'run', script, 'project'], cwd: workspace });

    expect(await process.exited).toBe(0);

    const feature = join(workspace, 'src', 'features', 'projects');
    expect(existsSync(join(feature, 'projects.routes.ts'))).toBe(true);
    expect(existsSync(join(feature, 'use-cases', 'commands', 'create-project.command.ts'))).toBe(true);
    expect(existsSync(join(feature, 'use-cases', 'commands', 'create-project.command.test.ts'))).toBe(true);
    expect(existsSync(join(feature, 'use-cases', 'queries', 'list-projects.query.ts'))).toBe(true);
    expect(existsSync(join(feature, 'projects.events.ts'))).toBe(true);
    expect(existsSync(join(feature, '__tests__', 'projects.integration.ts'))).toBe(true);
    expect(existsSync(join(feature, 'controller'))).toBe(false);
    expect(existsSync(join(feature, 'routes'))).toBe(false);
    expect(existsSync(join(feature, 'repository'))).toBe(false);
    expect(existsSync(join(feature, 'utils'))).toBe(false);
  });
});
