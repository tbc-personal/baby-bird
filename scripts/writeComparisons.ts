/**
 * The one way to write `data/comparisons.json` back to disk.
 *
 * Three scripts edit that file — `mark-reviewed`, `apply-fact-check` and
 * `fetch-commons-images` — and each of them used to serialise it with a bare
 * `JSON.stringify(data, null, 2)`. The committed file is Prettier-formatted, so
 * that reformatted every single-URL `sources` array from one line to three: a
 * one-flag change arrived as a 300-line diff, which is precisely the diff a
 * person is supposed to be able to read before a fact is signed off (ADR-004).
 *
 * Two fidelity rules live here so all three get them:
 *
 *   1. Format with Prettier, using the repository's own config, so the file
 *      round-trips unchanged when nothing changed.
 *   2. Put back the original spelling of integral floats. `JSON.stringify`
 *      renders 21.0 as 21 — the same number, but a change to rows the caller
 *      was not asked to touch.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import * as prettier from 'prettier';

/**
 * `JSON.stringify` renders 21.0 as 21. Put the original spelling back wherever
 * the value itself is unchanged.
 */
export function preserveIntegralFloats(next: string, prev: string): string {
  const wasFloat = new Set<string>();
  for (const m of prev.matchAll(/"([A-Za-z_]+)":\s(-?\d+)\.0(?=[,\n\r])/g)) {
    wasFloat.add(`${m[1]}:${m[2]}`);
  }
  if (wasFloat.size === 0) return next;
  return next.replace(
    /"([A-Za-z_]+)":\s(-?\d+)(?=[,\n\r])/g,
    (whole, key: string, num: string) =>
      wasFloat.has(`${key}:${num}`) ? `"${key}": ${num}.0` : whole,
  );
}

/**
 * Serialise `data` and write it to `path`, preserving the file's formatting and
 * its integral floats. `original` defaults to whatever is on disk now.
 */
export async function writeComparisons(
  path: string,
  data: unknown,
  original = readFileSync(path, 'utf8'),
): Promise<void> {
  const options = await prettier.resolveConfig(path);
  const formatted = await prettier.format(JSON.stringify(data, null, 2), {
    ...options,
    parser: 'json',
  });
  writeFileSync(path, preserveIntegralFloats(formatted, original));
}
