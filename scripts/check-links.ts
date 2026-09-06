/**
 * Quarterly link check (PLAN §2, ADR-003 "contributor deletes an asset").
 *
 * Verifies, for every row in `data/comparisons.json`:
 *   - `https://www.allaboutbirds.org/guide/<slug>/overview` returns 200
 *   - `https://ebird.org/species/<code>` returns 200
 *   - `https://macaulaylibrary.org/asset/<mlAssetId>` returns 200
 *   - every Commons `sourceUrl` and `licenseUrl` returns 200
 *
 * Not part of `ci.yml`: it makes several dozen requests to Cornell and would be
 * a poor neighbor on every push, and a network failure is not a code failure.
 * Run it by hand, or on a schedule, with `npm run check-links`.
 *
 * Exit code 1 if any URL does not resolve. `--verbose` lists the passes too.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparisonsSchema } from '../src/lib/schema.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raw: unknown = JSON.parse(
  readFileSync(resolve(repoRoot, 'data/comparisons.json'), 'utf8'),
);
const data = comparisonsSchema.parse(raw);
const verbose = process.argv.includes('--verbose');

interface Check {
  readonly label: string;
  readonly url: string;
}

const checks: Check[] = [];
for (const row of data.weeks) {
  if (row.allAboutBirdsSlug) {
    checks.push({
      label: `week ${row.week} All About Birds`,
      url: `https://www.allaboutbirds.org/guide/${row.allAboutBirdsSlug}/overview`,
    });
  }
  if (row.ebirdSpeciesCode) {
    checks.push({
      label: `week ${row.week} eBird`,
      url: `https://ebird.org/species/${row.ebirdSpeciesCode}`,
    });
  }
  const image = row.image;
  if (image?.mlAssetId) {
    checks.push({
      label: `week ${row.week} Macaulay asset`,
      url: `https://macaulaylibrary.org/asset/${image.mlAssetId}`,
    });
  }
  if (image?.fallbackMlAssetId) {
    checks.push({
      label: `week ${row.week} Macaulay fallback asset`,
      url: `https://macaulaylibrary.org/asset/${image.fallbackMlAssetId}`,
    });
  }
  if (image?.sourceUrl) {
    checks.push({ label: `week ${row.week} image source`, url: image.sourceUrl });
  }
  if (image?.licenseUrl) {
    checks.push({ label: `week ${row.week} image license`, url: image.licenseUrl });
  }
}

/** One request at a time with a short pause; this is a courtesy check, not a load test. */
const failures: string[] = [];
for (const check of checks) {
  const status = await head(check.url);
  const ok = status >= 200 && status < 400;
  if (!ok) failures.push(`${check.label}: ${status} ${check.url}`);
  if (verbose || !ok) console.log(`${ok ? 'ok  ' : 'FAIL'} ${status} ${check.label}`);
  await sleep(250);
}

console.log(`\nchecked ${checks.length} URL(s), ${failures.length} failure(s)`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

async function head(url: string): Promise<number> {
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    return response.status;
  } catch {
    return 0;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}
