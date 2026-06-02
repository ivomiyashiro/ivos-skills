#!/usr/bin/env bun
/**
 * scaffold-module.ts — genera un modulo con capas HTTP/application/domain/infrastructure.
 *
 * Uso:
 *   bun run scripts/scaffold-module.ts <module-name> [--no-tests] [--plural=<plural>]
 *
 * Donde <module-name> es el nombre singular en kebab-case.
 */

import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';

type Args = {
  module: string;
  noTests: boolean;
  plural?: string;
};

const parseArgs = (argv: string[]): Args => {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      flags[k] = v ?? true;
    } else {
      positional.push(arg);
    }
  }

  if (positional.length === 0) {
    console.error('Usage: bun run scripts/scaffold-module.ts <module-name> [--no-tests] [--plural=<plural>]');
    process.exit(1);
  }

  const module = positional[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!module) {
    console.error('Invalid module name');
    process.exit(1);
  }

  return {
    module,
    noTests: Boolean(flags['no-tests']),
    plural: typeof flags.plural === 'string' ? flags.plural : undefined,
  };
};

const toPascalCase = (s: string) =>
  s
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');

const toCamelCase = (s: string) => {
  const pascal = toPascalCase(s);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const simplePluralize = (s: string): string => {
  if (s.endsWith('y') && !/[aeiou]y$/.test(s)) return `${s.slice(0, -1)}ies`;
  if (s.endsWith('s') || s.endsWith('x') || s.endsWith('z') || s.endsWith('ch') || s.endsWith('sh')) return `${s}es`;
  return `${s}s`;
};

type Placeholders = {
  module: string;
  modules: string;
  Module: string;
  Modules: string;
  MODULE: string;
  moduleCamel: string;
};

const buildPlaceholders = (args: Args): Placeholders => {
  const module = args.module;
  const modules = args.plural ?? simplePluralize(module);

  return {
    module,
    modules,
    Module: toPascalCase(module),
    Modules: toPascalCase(modules),
    MODULE: module.toUpperCase().replace(/-/g, '_'),
    moduleCamel: toCamelCase(module),
  };
};

const applyPlaceholders = (input: string, p: Placeholders): string =>
  input
    .replaceAll('__Modules__', p.Modules)
    .replaceAll('__Module__', p.Module)
    .replaceAll('__modules__', p.modules)
    .replaceAll('__module__', p.module)
    .replaceAll('__MODULE__', p.MODULE)
    .replaceAll('__moduleCamel__', p.moduleCamel);

const shouldSkip = (relPath: string, args: Args): boolean => {
  if (relPath === 'README.md') return true;
  if (args.noTests && relPath === '__modules__.routes.test.ts.tmpl') return true;
  return false;
};

const stripTmpl = (filename: string): string =>
  filename.endsWith('.tmpl') ? filename.slice(0, -5) : filename;

const walk = async (dir: string, base = dir): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full, base)));
    } else {
      files.push(full.slice(base.length + 1).split(sep).join('/'));
    }
  }

  return files;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const placeholders = buildPlaceholders(args);

  const templatesDir = new URL('./templates/module-slice', import.meta.url).pathname;
  const normalizedTemplatesDir =
    process.platform === 'win32' && templatesDir.startsWith('/')
      ? templatesDir.slice(1)
      : templatesDir;

  const destDir = join(process.cwd(), 'src', 'modules', placeholders.modules);

  if (existsSync(destDir)) {
    console.error(`Destination already exists: ${destDir}`);
    process.exit(1);
  }

  console.log(`Scaffolding module "${placeholders.module}" (folder: ${placeholders.modules})...`);
  console.log(`  templates: ${normalizedTemplatesDir}`);
  console.log(`  output:    ${destDir}`);

  const files = await walk(normalizedTemplatesDir);
  const created: string[] = [];

  for (const rel of files) {
    if (shouldSkip(rel, args)) continue;

    const renamed = applyPlaceholders(stripTmpl(rel), placeholders);
    const outPath = join(destDir, renamed);
    await mkdir(dirname(outPath), { recursive: true });

    const content = await readFile(join(normalizedTemplatesDir, rel), 'utf-8');
    await writeFile(outPath, applyPlaceholders(content, placeholders));
    created.push(renamed);
  }

  console.log('\nCreated:');
  for (const file of created) console.log(`  src/modules/${placeholders.modules}/${file}`);

  console.log('\nNext steps:');
  console.log('  1. Definir tabla en src/shared/db/schema.ts y generar migracion.');
  console.log(`  2. Registrar repo/read model en src/container.ts.`);
  console.log(`  3. Mountear en src/app.ts:`);
  console.log(`       app.route('/${placeholders.modules}', build${placeholders.Modules}Routes(container));`);
  console.log('  4. Reemplazar TODOs de infrastructure con queries Drizzle reales.');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
