#!/usr/bin/env bun
/**
 * check-boundaries.ts — verifica boundaries básicos entre shared y features.
 *
 * Reglas:
 * - src/shared no puede importar src/features.
 * - Una feature no puede importar subpaths internos de otra feature.
 * - Una feature puede importar la API pública de otra: @features/<feature>.
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';

type Violation = {
  file: string;
  specifier: string;
  message: string;
};

const root = process.cwd();
const srcDir = join(root, 'src');
const sharedDir = join(srcDir, 'shared');
const featuresDir = join(srcDir, 'features');
const importRe = /\b(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;

const isTsFile = (file: string) =>
  (file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts');

const toPosix = (path: string) => path.split(sep).join('/');

const walk = async (dir: string): Promise<string[]> => {
  if (!existsSync(dir)) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (isTsFile(full)) {
      files.push(full);
    }
  }

  return files;
};

const featureNameForFile = (file: string): string | null => {
  const rel = toPosix(relative(featuresDir, file));
  if (rel.startsWith('..')) return null;
  return rel.split('/')[0] || null;
};

const featureImportFromAlias = (specifier: string) => {
  const match = specifier.match(/^@features\/([^/]+)(?:\/(.*))?$/);
  if (!match) return null;
  return { feature: match[1], subpath: match[2] ?? '' };
};

const featureImportFromRootAlias = (specifier: string) => {
  const match = specifier.match(/^@\/features\/([^/]+)(?:\/(.*))?$/);
  if (!match) return null;
  return { feature: match[1], subpath: match[2] ?? '' };
};

const resolveRelativeImport = (file: string, specifier: string): string | null => {
  if (!specifier.startsWith('.')) return null;
  return normalize(resolve(dirname(file), specifier));
};

const pointsInside = (target: string | null, dir: string) => {
  if (!target) return false;
  const rel = relative(dir, target);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
};

const featureNameForTarget = (target: string | null): string | null => {
  if (!target || !pointsInside(target, featuresDir)) return null;
  const rel = toPosix(relative(featuresDir, target));
  return rel.split('/')[0] || null;
};

const checkFile = async (file: string): Promise<Violation[]> => {
  const content = await readFile(file, 'utf8');
  const violations: Violation[] = [];
  const relFile = toPosix(relative(root, file));
  const sourceFeature = featureNameForFile(file);
  const inShared = pointsInside(file, sharedDir);

  for (const match of content.matchAll(importRe)) {
    const specifier = match[1];
    const aliasFeature = featureImportFromAlias(specifier) ?? featureImportFromRootAlias(specifier);
    const relativeTarget = resolveRelativeImport(file, specifier);
    const targetFeature = aliasFeature?.feature ?? featureNameForTarget(relativeTarget);

    if (inShared && (aliasFeature || pointsInside(relativeTarget, featuresDir))) {
      violations.push({
        file: relFile,
        specifier,
        message: 'shared must not import features',
      });
      continue;
    }

    if (!sourceFeature || !targetFeature || targetFeature === sourceFeature) continue;

    if (aliasFeature) {
      if (aliasFeature.subpath) {
        violations.push({
          file: relFile,
          specifier,
          message: `feature "${sourceFeature}" must import feature "${targetFeature}" through @features/${targetFeature}`,
        });
      }
      continue;
    }

    violations.push({
      file: relFile,
      specifier,
      message: `feature "${sourceFeature}" must not use relative imports into feature "${targetFeature}"`,
    });
  }

  return violations;
};

const files = [...(await walk(sharedDir)), ...(await walk(featuresDir))];
const violations = (await Promise.all(files.map(checkFile))).flat();

if (violations.length > 0) {
  console.error('\nBoundary violations:');
  for (const violation of violations) {
    console.error(`- ${violation.file}: "${violation.specifier}"`);
    console.error(`  ${violation.message}`);
  }
  process.exit(1);
}

console.log('Boundary checks passed');
