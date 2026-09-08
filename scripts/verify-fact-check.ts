/**
 * Audit the fact-check reports before a human reads them (work-order P1).
 *
 * The failure mode this whole pass exists to catch is a confident verdict
 * backed by a quote nobody read. A reviewer cannot spot that by reading — the
 * fabricated quote reads exactly like the real one. So this checks it
 * mechanically: every blockquote in every report is normalised and looked up in
 * the downloaded corpus. A quote that appears nowhere either came from a live
 * lookup the reviewer did themselves (fine, but it should say so) or was
 * invented (not fine).
 *
 * Also checks that every fact in range is actually covered, that verdicts come
 * from the fixed vocabulary, and that no Evidence block cites All About Birds,
 * which cannot be opened from here at all.
 *
 * Note: the reports describe the facts as they stood BEFORE `apply-fact-check` ran.
 * Once the nine rewrites are in `data/comparisons.json`, regenerating the corpus and
 * re-running this will report those nine as missing from the reports. That is expected
 * — the reports are a snapshot of what was checked, not a description of the file now.
 *
 * Run with `npm run verify-fact-check` after `npm run fact-sources`.
 * Exit code 1 if any report has a coverage, vocabulary, or citation problem;
 * untraceable quotes are reported but do not fail the run, since a legitimate
 * live lookup produces them.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = resolve(ROOT, '.fact-check/corpus');
const REPORTS = resolve(ROOT, 'docs/research');
const VERDICTS = ['supported', 'partly supported', 'contradicted', 'unverifiable'];

const norm = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

if (!existsSync(CORPUS)) {
  console.error('No corpus at .fact-check/corpus — run `npm run fact-sources` first.');
  process.exit(1);
}

/** Shape written by `fetch-fact-sources.ts`. */
interface CorpusWeek {
  week: number;
  facts: { text: string }[];
  documents: { text: string | null }[];
}

const factsByWeek = new Map<number, string[]>();
const haystack: string[] = [];
for (const file of readdirSync(CORPUS).filter((f) => f.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(resolve(CORPUS, file), 'utf8')) as CorpusWeek;
  factsByWeek.set(
    d.week,
    d.facts.map((f) => f.text),
  );
  for (const doc of d.documents) if (doc.text) haystack.push(norm(doc.text));
}
const HAY = haystack.join(' ');
const allFacts = [...factsByWeek.values()].flat().map(norm);

let failed = false;
const reports = readdirSync(REPORTS).filter((f) => /^fact-check-\d+-\d+\.md$/.test(f));
if (reports.length === 0) {
  console.error(`No fact-check reports in ${REPORTS}.`);
  process.exit(1);
}

for (const file of reports.sort()) {
  const [lo, hi] = (file.match(/(\d+)-(\d+)\.md$/) as RegExpMatchArray)
    .slice(1)
    .map(Number);
  const text = readFileSync(resolve(REPORTS, file), 'utf8');
  const flat = norm(text);
  const problems: string[] = [];

  // 1. Coverage — every fact in the range has to appear.
  const missing: string[] = [];
  for (const [week, facts] of factsByWeek) {
    if (week < lo || week > hi) continue;
    for (const f of facts) {
      if (!flat.includes(norm(f).split(' ').slice(0, 8).join(' '))) {
        missing.push(`w${week}: ${f.slice(0, 55)}`);
      }
    }
  }
  if (missing.length)
    problems.push(`${missing.length} fact(s) missing: ${missing.slice(0, 3).join(' | ')}`);

  // 2. Verdict vocabulary. Reports vary in whether they backtick the label or
  // end it with a full stop, so normalise before comparing rather than
  // demanding one exact shape and silently counting zero.
  const verdicts = [
    ...text.matchAll(/\*\*Verdict:?\*\*:?\s*[`*_]*([A-Za-z][A-Za-z ]*)/g),
  ].map((m) =>
    m[1]
      .trim()
      .replace(/[.\s]+$/, '')
      .toLowerCase(),
  );
  const illegal = [...new Set(verdicts)].filter((v) => !VERDICTS.includes(v));
  if (illegal.length) problems.push(`non-standard verdicts: ${illegal.join(', ')}`);
  const counts = Object.fromEntries(
    VERDICTS.map((v) => [v, verdicts.filter((x) => x === v).length]),
  );

  // 3. All About Birds must never appear as evidence.
  for (const m of text.matchAll(/\*\*Evidence:?\*\*([\s\S]{0,1200}?)(?=\n\*\*|\n#|$)/g)) {
    if (m[1].includes('allaboutbirds.org')) {
      problems.push(
        'an Evidence block cites allaboutbirds.org, which cannot be opened from here',
      );
      break;
    }
  }

  // 4. Quoted evidence must trace back to the corpus.
  const untraceable: string[] = [];
  let quoted = 0;
  for (const m of text.matchAll(/(?:^> .*\n)+/gm)) {
    const q = m[0].replace(/^> ?/gm, '').replace(/\s+/g, ' ').trim();
    if (q.length < 60) continue;
    quoted++;
    const nq = norm(q);
    // A blockquote of the claim itself is not evidence.
    if (allFacts.some((f) => nq.includes(f) || f.includes(nq))) continue;
    const toks = nq.split(' ');
    let hit = false;
    for (const size of [18, 12, 8]) {
      if (toks.length < size) continue;
      for (let i = 0; i + size <= toks.length && !hit; i += 3) {
        if (HAY.includes(toks.slice(i, i + size).join(' '))) hit = true;
      }
      if (hit) break;
    }
    if (!hit) untraceable.push(q.slice(0, 120));
  }

  console.log(`\n=== ${file} (weeks ${lo}-${hi}) ===`);
  console.log(`  verdicts: ${JSON.stringify(counts)}  (${verdicts.length} labelled)`);
  console.log(
    `  evidence blockquotes: ${quoted}, not traceable to corpus: ${untraceable.length}`,
  );
  for (const p of problems) {
    failed = true;
    console.log(`  PROBLEM: ${p}`);
  }
  if (untraceable.length) {
    console.log('  Quotes absent from the corpus — confirm each came from a live lookup:');
    for (const u of untraceable.slice(0, 10)) console.log(`    - ${u}`);
  }
}

console.log(
  failed ? '\nFAIL — see problems above.' : '\nAll reports pass the structural checks.',
);
process.exit(failed ? 1 : 0);
