#!/usr/bin/env bun
/**
 * scaffold-feature.ts — genera un nuevo feature slice desde templates.
 *
 * Uso:
 *   bun run scripts/scaffold-feature.ts <feature-name> [--no-events] [--no-tests]
 *
 * Donde <feature-name> es el nombre singular en kebab-case.
 *
 * Ejemplo:
 *   bun run scripts/scaffold-feature.ts quote
 *   → genera src/features/quotes/ con todos los archivos renombrados.
 */

import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';

type Args = {
  feature: string;
  noEvents: boolean;
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
    console.error('Usage: bun run scripts/scaffold-feature.ts <feature-name> [--no-events] [--no-tests] [--plural=<plural>]');
    process.exit(1);
  }

  const feature = positional[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!feature) {
    console.error('Invalid feature name');
    process.exit(1);
  }

  return {
    feature,
    noEvents: Boolean(flags['no-events']),
    noTests: Boolean(flags['no-tests']),
    plural: typeof flags['plural'] === 'string' ? flags['plural'] : undefined,
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
  if (s.endsWith('y') && !/[aeiou]y$/.test(s)) return s.slice(0, -1) + 'ies';
  if (s.endsWith('s') || s.endsWith('x') || s.endsWith('z') || s.endsWith('ch') || s.endsWith('sh')) return s + 'es';
  return s + 's';
};

type Placeholders = {
  feature: string;        // quote
  features: string;       // quotes
  Feature: string;        // Quote
  Features: string;       // Quotes
  FEATURE: string;        // QUOTE
  featureCamel: string;   // quote
  action: string;         // create-quote
  query: string;          // get-quote-by-id
};

const buildPlaceholders = (args: Args): Placeholders => {
  const feature = args.feature;
  const features = args.plural ?? simplePluralize(feature);
  const Feature = toPascalCase(feature);
  const Features = toPascalCase(features);
  const FEATURE = feature.toUpperCase().replace(/-/g, '_');
  const featureCamel = toCamelCase(feature);
  return {
    feature,
    features,
    Feature,
    Features,
    FEATURE,
    featureCamel,
    action: `create-${feature}`,
    query: `get-${feature}-by-id`,
  };
};

const applyPlaceholders = (input: string, p: Placeholders): string =>
  input
    .replaceAll('__Features__', p.Features)
    .replaceAll('__Feature__', p.Feature)
    .replaceAll('__features__', p.features)
    .replaceAll('__feature__', p.feature)
    .replaceAll('__FEATURE__', p.FEATURE)
    .replaceAll('__FeatureCamel__', p.featureCamel)
    .replaceAll('__action__', p.action)
    .replaceAll('__query__', p.query);

const shouldSkip = (relPath: string, args: Args): boolean => {
  if (relPath === 'README.md') return true;
  if (args.noEvents && relPath === 'events.ts.tmpl') return true;
  if (args.noTests && relPath === 'routes.test.ts.tmpl') return true;
  return false;
};

const stripTmpl = (filename: string): string =>
  filename.endsWith('.tmpl') ? filename.slice(0, -5) : filename;

const walk = async (dir: string, base = dir): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walk(full, base)));
    } else {
      // Normalizar a forward slash para keying y matching cross-platform.
      files.push(full.slice(base.length + 1).split(sep).join('/'));
    }
  }
  return files;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const placeholders = buildPlaceholders(args);

  const templatesDir = new URL('./templates/feature-slice', import.meta.url).pathname;
  // En Windows, la URL pathname puede tener un leading slash extraño:
  const normalizedTemplatesDir = process.platform === 'win32' && templatesDir.startsWith('/')
    ? templatesDir.slice(1)
    : templatesDir;

  const destDir = join(process.cwd(), 'src', 'features', placeholders.features);

  if (existsSync(destDir)) {
    console.error(`Destination already exists: ${destDir}`);
    process.exit(1);
  }

  console.log(`Scaffolding feature "${placeholders.feature}" (plural: ${placeholders.features})...`);
  console.log(`  templates: ${normalizedTemplatesDir}`);
  console.log(`  output:    ${destDir}`);

  const files = await walk(normalizedTemplatesDir);
  const created: string[] = [];

  for (const rel of files) {
    if (shouldSkip(rel, args)) continue;

    const renamed = applyPlaceholders(stripTmpl(rel), placeholders);
    const outPath = join(destDir, renamed);
    // dirname maneja `\` en Windows y `/` en POSIX; lastIndexOf('/') no.
    const outDir = dirname(outPath);

    await mkdir(outDir, { recursive: true });

    const srcPath = join(normalizedTemplatesDir, rel);
    const content = await readFile(srcPath, 'utf-8');
    const transformed = applyPlaceholders(content, placeholders);
    await writeFile(outPath, transformed);
    created.push(renamed);
  }

  console.log('\nCreated:');
  for (const c of created) console.log(`  src/features/${placeholders.features}/${c}`);

  console.log('\nNext steps:');
  console.log(`  1. Definir tabla en src/shared/db/schema.ts`);
  console.log(`  2. Implementar repository.ts (reemplazar TODOs)`);
  console.log(`  3. Implementar query handler (reemplazar stub)`);
  console.log(`  4. Mountear en src/app.ts:`);
  console.log(`       app.route('/${placeholders.features}', build${placeholders.Features}Routes(deps));`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
