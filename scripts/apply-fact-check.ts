/**
 * Apply the fact-check changeset to `data/comparisons.json` (ADR-004).
 *
 * Reads `docs/research/fact-check-changeset.json`, which names each change by
 * week and 1-based index into that week's `facts[]` and records why it is being
 * made. Keeping the changeset separate from this script means the content
 * decisions can be reviewed on their own, and the application re-run.
 *
 * What it deliberately does NOT do: set `reviewed: true`. Per ADR-004
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
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparisonsSchema } from '../src/lib/schema.ts';
import { writeComparisons } from './writeComparisons.ts';

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
  /** The comparison this entry was written against; see the lookup below. */
  comparison?: string;
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
    comparison: string | null;
    facts: { text: string; sources: string[]; reviewed: boolean }[];
  }[];
};
const byWeek = new Map(data.weeks.map((w) => [w.week, w]));
/** Comparison name to row, so a renumbering of the table cannot misalign this. */
const byComparison = new Map(
  data.weeks.filter((w) => w.comparison).map((w) => [w.comparison as string, w]),
);

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

const problems: string[] = [];
const skipped: string[] = [];
let skippedEntries = 0;
let rewritten = 0;
let recited = 0;

for (const c of changeset.changes) {
  /*
   * Match on the comparison, not the week number. This changeset was written
   * when the table began at week 2; it begins at week 3 now, because the poppy
   * seed moved and the week-3 "grain of grit" comparison was dropped. Applying
   * it by week would have put grit's citation onto the poppy's third fact and
   * said nothing about it. (That never happened: the changeset was applied
   * before the renumbering, and the data is correct. The hazard was only ever
   * for a re-run.)
   */
  const week = c.comparison ? byComparison.get(c.comparison) : byWeek.get(c.week);
  if (!week) {
    if (c.comparison) {
      // The comparison was dropped from the table, so this entry is stale
      // rather than broken. Say so and carry on; it is not a failure.
      const note = `  "${c.comparison}" (changeset week ${c.week}) is no longer in the data`;
      if (!skipped.includes(note)) skipped.push(note);
      skippedEntries += 1;
    } else {
      problems.push(`week ${c.week} is not in the data, and the entry names no comparison`);
    }
    continue;
  }
  const fact = week.facts[c.fact - 1];
  if (!fact) {
    problems.push(`"${week.comparison}" has no fact ${c.fact}`);
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

if (skipped.length) {
  console.log(
    `\nskipped ${skippedEntries} stale entr(y/ies) for ${skipped.length} dropped comparison(s):`,
  );
  for (const line of skipped) console.log(line);
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
const reviewed = data.weeks.flatMap((w) => w.facts.filter((f) => f.reviewed)).length;
console.log(
  `Facts marked reviewed:true: ${reviewed}, unchanged by this script. ` +
    `Setting that flag is the author's act (ADR-004).`,
);

if (dryRun) {
  console.log('\n--dry-run: nothing written.');
} else {
  await writeComparisons(DATA, data, original);
  console.log(`\nWrote ${DATA}.`);
}
