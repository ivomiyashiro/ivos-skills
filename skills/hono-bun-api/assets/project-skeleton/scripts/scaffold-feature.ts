#!/usr/bin/env bun
/**
 * scaffold-feature.ts — generates a flat feature with routes, operations, and events.
 *
 * Uso:
 *   bun run scripts/scaffold-feature.ts <feature-name> [--no-tests] [--plural=<plural>]
 *
 * Donde <feature-name> es el nombre singular en kebab-case.
 */

import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';

type Args = {
  feature: string;
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
    console.error('Usage: bun run scripts/scaffold-feature.ts <feature-name> [--no-tests] [--plural=<plural>]');
    process.exit(1);
  }

  const feature = positional[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!feature) {
    console.error('Invalid feature name');
    process.exit(1);
  }

  return {
    feature,
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
  feature: string;
  features: string;
  Feature: string;
  Features: string;
  FEATURE: string;
  featureCamel: string;
};

const buildPlaceholders = (args: Args): Placeholders => {
  const feature = args.feature;
  const features = args.plural ?? simplePluralize(feature);

  return {
    feature,
    features,
    Feature: toPascalCase(feature),
    Features: toPascalCase(features),
    FEATURE: feature.toUpperCase().replace(/-/g, '_'),
    featureCamel: toCamelCase(feature),
  };
};

const applyPlaceholders = (input: string, p: Placeholders): string =>
  input
    .replaceAll('__Features__', p.Features)
    .replaceAll('__Feature__', p.Feature)
    .replaceAll('__features__', p.features)
    .replaceAll('__feature__', p.feature)
    .replaceAll('__FEATURE__', p.FEATURE)
    .replaceAll('__featureCamel__', p.featureCamel);

const shouldSkip = (relPath: string, args: Args): boolean => {
  if (relPath === 'README.md') return true;
  if (args.noTests && (relPath.endsWith('.test.ts.tmpl') || relPath.startsWith('__tests__/'))) return true;
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

  const templatesDir = new URL('./templates/feature-slice', import.meta.url).pathname;
  const normalizedTemplatesDir =
    process.platform === 'win32' && templatesDir.startsWith('/')
      ? templatesDir.slice(1)
      : templatesDir;

  const destDir = join(process.cwd(), 'src', 'features', placeholders.features);

  if (existsSync(destDir)) {
    console.error(`Destination already exists: ${destDir}`);
    process.exit(1);
  }

  console.log(`Scaffolding feature "${placeholders.feature}" (folder: ${placeholders.features})...`);
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
  for (const file of created) console.log(`  src/features/${placeholders.features}/${file}`);

  console.log('\nNext steps:');
  console.log('  1. Define the table in src/shared/db/schema.ts and generate a migration.');
  console.log('  2. Pass db, tx, eventBus, and clock from src/di-container.ts as required.');
  console.log('  3. Mount the feature in src/app.ts:');
  console.log(
    `       app.route('/${placeholders.features}', build${placeholders.Features}Routes({ /* feature deps */ }));`,
  );
  console.log('  4. Replace operation TODOs with direct Drizzle queries.');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
