/**
 * Set `reviewed: true` on the facts the P1 pass found plainly supported
 * (CURATION.md task B sign-off).
 *
 * The verdicts live in the summary table of each `docs/research/fact-check-*.md`
 * report, three rows per week in week order. This reads them back rather than
 * taking a hand-typed list, so the flags in `data/comparisons.json` and the
 * evidence in the reports cannot drift apart.
 *
 * A fact is marked reviewed only if its verdict begins with "Supported" and it
 * is not in HELD_BACK below. Everything else — partly supported, contradicted,
 * unverifiable, and the nine facts rewritten during the pass — stays
 * `reviewed: false`, so the draft chip (dev, or `?review=1`) shows exactly the
 * rows still wanting the author's eye.
 *
 * Run with `npm run mark-reviewed`. `--dry-run` reports without writing.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparisonsSchema } from '../src/lib/schema.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'data/comparisons.json');
const REPORTS = resolve(ROOT, 'docs/research');
const dryRun = process.argv.includes('--dry-run');

/**
 * Facts the reports call supported but that still carry an open question, so
 * they are not signed off with the rest. Keyed "week.factNumber" (1-based).
 */
const HELD_BACK: Record<string, string> = {
  '13.1':
    'Supported, but 2 m across and a tonne are the record nest’s figures, not a typical one. Whether the sentence should read as a record is a framing call for the author.',
};

interface Row {
  week: number;
  verdict: string;
}

function readVerdicts(): Row[] {
  const rows: Row[] = [];
  for (const file of readdirSync(REPORTS)
    .filter((f) => /^fact-check-\d+-\d+\.md$/.test(f))
    .sort()) {
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
      rows.push({ week: Number(cells[0]), verdict: cells[3] });
    }
  }
  return rows;
}

const raw: unknown = JSON.parse(readFileSync(DATA, 'utf8'));
comparisonsSchema.parse(raw);
const data = raw as {
  weeks: { week: number; facts: { text: string; reviewed: boolean }[] }[];
};
const byWeek = new Map(data.weeks.map((w) => [w.week, w]));

const rows = readVerdicts();
const seen = new Map<number, number>();
let marked = 0;
const held: string[] = [];

for (const row of rows) {
  const index = seen.get(row.week) ?? 0;
  seen.set(row.week, index + 1);
  const fact = byWeek.get(row.week)?.facts[index];
  if (!fact) throw new Error(`week ${row.week} has no fact ${index + 1}`);

  const key = `${row.week}.${index + 1}`;
  // Strip the bold markers some reports use on non-supported verdicts.
  const verdict = row.verdict.replace(/\*/g, '').trim();
  const supported = /^Supported\b/i.test(verdict);

  if (supported && !HELD_BACK[key]) {
    fact.reviewed = true;
    marked++;
  } else {
    fact.reviewed = false;
    held.push(`  ${key.padEnd(6)} ${HELD_BACK[key] ? 'held back' : verdict}`);
  }
}

if (rows.length !== data.weeks.reduce((a, w) => a + w.facts.length, 0)) {
  throw new Error(`report rows (${rows.length}) do not cover every fact`);
}

comparisonsSchema.parse(data);

console.log(`reviewed: true  ${marked}`);
console.log(`reviewed: false ${held.length}`);
for (const line of held) console.log(line);

if (dryRun) {
  console.log('\n--dry-run: nothing written.');
} else {
  writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWrote ${DATA}.`);
}
