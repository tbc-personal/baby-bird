/**
 * Set `reviewed: true` on the facts the P1 pass found plainly supported
 * (ADR-004, "Sign-off: what `reviewed: true` means").
 *
 * The verdicts live in the summary table of each `docs/research/fact-check-*.md`
 * report. This reads them back rather than taking a hand-typed list, so the
 * flags in `data/comparisons.json` and the evidence in the reports cannot drift
 * apart.
 *
 * A fact is marked reviewed only if its verdict begins with "Supported" and it
 * is not in HELD_BACK below. Everything else — partly supported, contradicted,
 * unverifiable, and every fact rewritten during a pass — is left alone, so the
 * draft chip (dev, or `?review=1`) shows exactly the rows still wanting the
 * author's eye.
 *
 * Two rules keep this inside what ADR-004 permits a script to do:
 *
 *   1. **It never clears a flag.** Setting `reviewed: true` is the author's
 *      act; clearing one someone set by hand would be the same laundering in
 *      reverse. Where a report disagrees with a flag already set, this says so
 *      and changes nothing — a person resolves it.
 *   2. **It matches on the comparison, not the week number.** The reports were
 *      written when the table began at week 2. It begins at week 3 now: the
 *      poppy seed moved from 2 to 3 and the week-3 "grain of grit" comparison
 *      was dropped. Matching positionally by week silently mapped grit's
 *      verdicts onto the poppy's facts — or, as it happened, threw on the first
 *      row. Matching by name survives any renumbering, and anything that cannot
 *      be matched is reported rather than guessed at.
 *
 * Run with `npm run mark-reviewed`. `--dry-run` reports without writing.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparisonsSchema } from '../src/lib/schema.ts';
import { writeComparisons } from './writeComparisons.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'data/comparisons.json');
const REPORTS = resolve(ROOT, 'docs/research');
const dryRun = process.argv.includes('--dry-run');

/**
 * Facts the reports call supported but that still carry an open question, so
 * they are not signed off with the rest. Keyed by comparison and 1-based fact
 * number, so the key survives the table being renumbered.
 */
const HELD_BACK: Record<string, string> = {
  'Bald Eagle egg.1':
    'Supported, but 2 m across and a tonne are the record nest’s figures, not a typical one. Whether the sentence should read as a record is a framing call for the author.',
};

interface Row {
  /** The week as the report numbered it, for messages only. */
  reportWeek: number;
  comparison: string;
  verdict: string;
}

function readVerdicts(): Row[] {
  const rows: Row[] = [];
  // Sort by the first week each report covers, not by filename: as strings,
  // "fact-check-13-22" sorts before "fact-check-2-12".
  const files = readdirSync(REPORTS)
    .filter((f) => /^fact-check-\d+-\d+\.md$/.test(f))
    .sort((a, b) => Number(/-(\d+)-/.exec(a)?.[1]) - Number(/-(\d+)-/.exec(b)?.[1]));
  for (const file of files) {
    const body = readFileSync(resolve(REPORTS, file), 'utf8');
    const table = /\n(\|\s*Week\s*\|[\s\S]*?)\n\n/.exec(body);
    if (!table) throw new Error(`no summary table in ${file}`);
    for (const line of table[1].split('\n')) {
      const cells = line
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim());
      if (cells.length < 5) continue;
      if (cells[0] === 'Week' || /^[-: ]+$/.test(cells[0])) continue;
      rows.push({
        reportWeek: Number(cells[0]),
        comparison: cells[1] ?? '',
        verdict: cells[3] ?? '',
      });
    }
  }
  return rows;
}

const raw: unknown = JSON.parse(readFileSync(DATA, 'utf8'));
comparisonsSchema.parse(raw);
const data = raw as {
  weeks: {
    week: number;
    comparison: string | null;
    facts: { text: string; reviewed: boolean }[];
  }[];
};

/**
 * Resolve a report's comparison name to a data row. The reports truncate some
 * names to fit the column ("Millet" for "Millet seed"), so a unique prefix
 * counts; anything ambiguous is an error rather than a guess.
 */
function findWeek(name: string) {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const target = norm(name);
  const exact = data.weeks.filter((w) => w.comparison && norm(w.comparison) === target);
  if (exact.length === 1) return exact[0];
  const prefix = data.weeks.filter(
    (w) => w.comparison && norm(w.comparison).startsWith(target),
  );
  if (prefix.length === 1) return prefix[0];
  if (prefix.length > 1) {
    const names = prefix.map((w) => w.comparison).join(', ');
    throw new Error(`"${name}" matches more than one comparison: ${names}`);
  }
  return undefined;
}

const rows = readVerdicts();
const nextIndex = new Map<string, number>();
const covered = new Set<string>();
let marked = 0;
let already = 0;
const dropped: string[] = [];
let droppedRows = 0;
const pending: string[] = [];
const conflicts: string[] = [];

for (const row of rows) {
  const week = findWeek(row.comparison);
  if (!week) {
    const note = `  "${row.comparison}" (report week ${row.reportWeek}) is not in the data`;
    if (!dropped.includes(note)) dropped.push(note);
    droppedRows += 1;
    continue;
  }
  const index = nextIndex.get(week.comparison ?? '') ?? 0;
  nextIndex.set(week.comparison ?? '', index + 1);

  const fact = week.facts[index];
  if (!fact) {
    throw new Error(
      `"${week.comparison}" (week ${week.week}) has no fact ${index + 1}, ` +
        `but the reports carry a verdict for it`,
    );
  }
  covered.add(`${week.week}.${index + 1}`);

  const key = `${week.comparison ?? ''}.${index + 1}`;
  const label = `${String(week.week).padStart(2)}.${index + 1}`;
  // Strip the bold markers some reports use on non-supported verdicts.
  const verdict = row.verdict.replace(/\*/g, '').trim();
  const supported = /^Supported\b/i.test(verdict) && !HELD_BACK[key];

  if (supported) {
    if (fact.reviewed) already += 1;
    else {
      fact.reviewed = true;
      marked += 1;
    }
  } else if (fact.reviewed) {
    // Rule 1: never clear a flag. Someone set this by hand; say so and stop.
    conflicts.push(`  ${label}  reviewed, but the report says: ${verdict}`);
  } else {
    pending.push(`  ${label}  ${HELD_BACK[key] ? 'held back' : verdict}`);
  }
}

// Every fact must have had a verdict applied to it, or the reports and the data
// have diverged in a way that needs a person.
const missing: string[] = [];
for (const week of data.weeks) {
  week.facts.forEach((_, i) => {
    if (!covered.has(`${week.week}.${i + 1}`)) {
      missing.push(`  week ${week.week} fact ${i + 1} (${week.comparison ?? '—'})`);
    }
  });
}

comparisonsSchema.parse(data);

console.log(`newly marked reviewed  ${marked}`);
console.log(`already reviewed       ${already}`);
console.log(`left for the author    ${pending.length}`);
for (const line of pending) console.log(line);

if (dropped.length > 0) {
  console.log(
    `\nskipped ${droppedRows} report row(s) for ${dropped.length} comparison(s) ` +
      `no longer in the data:`,
  );
  for (const line of dropped) console.log(line);
}

if (missing.length > 0) {
  console.error(`\nERROR: ${missing.length} fact(s) had no verdict in any report:`);
  for (const line of missing) console.error(line);
}

if (conflicts.length > 0) {
  console.error(
    `\nERROR: ${conflicts.length} fact(s) are flagged reviewed against the reports:`,
  );
  for (const line of conflicts) console.error(line);
  console.error('  Nothing was cleared. Resolve these by hand; see ADR-004.');
}

if (missing.length > 0 || conflicts.length > 0) process.exit(1);

if (dryRun) {
  console.log('\n--dry-run: nothing written.');
} else {
  await writeComparisons(DATA, data);
  console.log(`\nWrote ${DATA}.`);
}
