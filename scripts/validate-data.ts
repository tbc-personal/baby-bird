/**
 * Validates `data/comparisons.json` and sets the exit code. Runs in CI.
 * The rules live in `src/lib/validateData.ts` so they can be unit-tested;
 * this wrapper adds the one check that needs the filesystem.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { referencedImageFiles, validateComparisons } from '../src/lib/validateData.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raw: unknown = JSON.parse(
  readFileSync(resolve(repoRoot, 'data/comparisons.json'), 'utf8'),
);

const report = validateComparisons(raw);
const errors = [...report.errors];

for (const { week, file } of referencedImageFiles(raw)) {
  const onDisk = resolve(repoRoot, 'public', file.replace(/^\/+/, ''));
  if (!existsSync(onDisk)) {
    errors.push(`week ${week} references a missing file: public/${file}`);
  }
}

for (const warning of report.warnings) console.warn(`warn  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);

const { stats } = report;
console.log(
  [
    '',
    `weeks:                 ${stats.weeks}`,
    `facts:                 ${stats.facts} (${stats.unreviewedFacts} unreviewed)`,
    `weeks missing facts:   ${stats.weeksMissingFacts}`,
    `weeks missing an image: ${stats.weeksMissingImage}`,
  ].join('\n'),
);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s). data/comparisons.json is not valid.`);
  process.exit(1);
}
console.log('\ndata/comparisons.json is valid.');
