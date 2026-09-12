/**
 * Apply the fact-check changeset to `data/comparisons.json` (CURATION.md §B).
 *
 * Reads `docs/research/fact-check-changeset.json`, which names each change by
 * week and 1-based index into that week's `facts[]` and records why it is being
 * made. Keeping the changeset separate from this script means the content
 * decisions can be reviewed on their own, and the application re-run.
 *
 * What it deliberately does NOT do: set `reviewed: true`. Per docs/CURATION.md
 * that is the author's act, and a script that flipped it would be laundering a
 * triage pass into a sign-off. Facts stay `reviewed: false` after this runs.
 *
 * Every rewritten fact is re-checked against the ADR-004 rules the data
 * validator enforces (one sentence, <= 160 characters, no exclamation marks, at
 * least one source) before anything is written, so a bad rewrite fails here
 * rather than in CI.
 *
 * Run with `npm run apply-fact-check`. `--dry-run` prints the diff without
 * writing. Exit code 1 if any change cannot be applied.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparisonsSchema } from '../src/lib/schema.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'data/comparisons.json');
const CHANGESET = resolve(ROOT, 'docs/research/fact-check-changeset.json');
const dryRun = process.argv.includes('--dry-run');

interface Change {
  week: number;
  /** 1-based index into that week's facts[]. */
  fact: number;
  sources: string[];
  text?: string;
  why: string;
  rewrite?: boolean;
}

const changeset = JSON.parse(readFileSync(CHANGESET, 'utf8')) as { changes: Change[] };
const original = readFileSync(DATA, 'utf8');
const raw: unknown = JSON.parse(original);
comparisonsSchema.parse(raw); // fail early if the file is already invalid

// Edit the parsed JSON rather than the zod output, so fields the schema does
// not model survive the round trip untouched.
const data = raw as {
  weeks: {
    week: number;
    facts: { text: string; sources: string[]; reviewed: boolean }[];
  }[];
};
const byWeek = new Map(data.weeks.map((w) => [w.week, w]));

/** The ADR-004 rules `validate-data.ts` enforces, checked before writing. */
function violations(text: string, sources: string[]): string[] {
  const out: string[] = [];
  if (text.length > 160) out.push(`${text.length} chars, over the 160 limit`);
  if (text.includes('!')) out.push('contains an exclamation mark');
  if (!/[.]$/.test(text.trim())) out.push('does not end in a full stop');
  if ((text.match(/[.!?](?=\s|$)/g) ?? []).length > 1)
    out.push('looks like more than one sentence');
  if (sources.length === 0) out.push('has no source');
  for (const s of sources) {
    if (!/^https:\/\//.test(s)) out.push(`source is not an https URL: ${s}`);
    if (s.includes('allaboutbirds.org')) {
      out.push(
        `cites All About Birds, which cannot be opened and whose text ADR-004 forbids reusing: ${s}`,
      );
    }
  }
  return out;
}

/**
 * `JSON.stringify` renders 21.0 as 21. That is the same number, but it is a
 * change to rows this pass was not asked to touch, so put the original spelling
 * back wherever the value is unchanged.
 */
function preserveIntegralFloats(next: string, prev: string): string {
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

const problems: string[] = [];
let rewritten = 0;
let recited = 0;

for (const c of changeset.changes) {
  const week = byWeek.get(c.week);
  const fact = week?.facts[c.fact - 1];
  if (!fact) {
    problems.push(`week ${c.week} fact ${c.fact} does not exist`);
    continue;
  }
  const text = c.text ?? fact.text;
  const bad = violations(text, c.sources);
  if (bad.length) {
    problems.push(`week ${c.week}.${c.fact}: ${bad.join('; ')}`);
    continue;
  }
  if (c.text && c.text !== fact.text) {
    console.log(`\nweek ${c.week}.${c.fact} REWRITE`);
    console.log(`  was: ${fact.text}`);
    console.log(`  now: ${c.text}`);
    console.log(`  why: ${c.why}`);
    fact.text = c.text;
    rewritten++;
  } else {
    recited++;
  }
  fact.sources = [...c.sources];
  // reviewed stays false, deliberately. See the header comment.
}

if (problems.length) {
  console.error(`\n${problems.length} change(s) could not be applied:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

const stillBlocked = data.weeks.flatMap((w) =>
  w.facts.flatMap((f) =>
    f.sources
      .filter((s) => s.includes('allaboutbirds.org'))
      .map((s) => `week ${w.week}: ${s}`),
  ),
);

comparisonsSchema.parse(data); // the edited file must still validate

console.log(
  `\n${rewritten} rewritten, ${recited} re-cited, ${changeset.changes.length} total.`,
);
console.log(
  stillBlocked.length
    ? `\n${stillBlocked.length} All About Birds citation(s) remain:\n  ${stillBlocked.join('\n  ')}`
    : '\nNo All About Birds citations remain.',
);
const unreviewed = data.weeks.flatMap((w) => w.facts.filter((f) => f.reviewed)).length;
console.log(
  `Facts marked reviewed:true: ${unreviewed} (should be 0 — that is the author's call).`,
);

if (dryRun) {
  console.log('\n--dry-run: nothing written.');
} else {
  writeFileSync(
    DATA,
    preserveIntegralFloats(JSON.stringify(data, null, 2) + '\n', original),
  );
  console.log(`\nWrote ${DATA}.`);
}
