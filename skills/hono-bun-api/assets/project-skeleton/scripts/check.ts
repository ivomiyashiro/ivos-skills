#!/usr/bin/env bun
/**
 * check.ts — corre typecheck + test + build en orden y aborta al primer fallo.
 *
 * Uso:
 *   bun run check
 */

type Step = { name: string; cmd: string[] };

const steps: Step[] = [
  { name: 'typecheck', cmd: ['bun', 'run', 'typecheck'] },
  { name: 'test', cmd: ['bun', 'test'] },
  { name: 'build', cmd: ['bun', 'run', 'build'] },
];

for (const step of steps) {
  console.log(`\n→ ${step.name}`);
  const proc = Bun.spawnSync({
    cmd: step.cmd,
    stdio: ['inherit', 'inherit', 'inherit'],
  });
  if (proc.exitCode !== 0) {
    console.error(`\n✗ ${step.name} failed (exit ${proc.exitCode})`);
    process.exit(proc.exitCode ?? 1);
  }
  console.log(`✓ ${step.name} ok`);
}

console.log('\nAll checks passed');
