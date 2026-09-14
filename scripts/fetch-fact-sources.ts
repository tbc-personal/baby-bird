/**
 * Build the evidence corpus for the fact-check pass (CURATION.md §B, work-order P1).
 *
 * Every fact in `data/comparisons.json` was drafted from the build session's own
 * knowledge and cited to a page that session could not open. This script opens
 * what it can, so the review is done against source text rather than memory.
 *
 * What it fetches, per comparison week:
 *   - every `en.wikipedia.org` URL in that week's `facts[].sources`, as full
 *     article plain text via the MediaWiki action API
 *   - the Audubon field guide page and the Birds of the World free introduction
 *     for the species
 *   - for each cited `www.allaboutbirds.org` URL: Audubon and Wikipedia pages
 *     for the species *named in that URL*. Cornell serves 403 to datacenter IPs
 *     (Cloudflare), so the cited page itself cannot be read from CI or from an
 *     agent sandbox; it is recorded as blocked rather than silently skipped.
 *     This substitution is what makes the seed weeks work — week 4 cites the
 *     American Goldfinch page, not a page about nyjer.
 *
 * Then it writes one adjudication brief per week range: for each fact, the
 * candidate passages from those sources ranked by term overlap, so a reviewer
 * judges claim-against-evidence instead of searching.
 *
 * Outputs (both gitignored):
 *   .fact-check/corpus/week-NN.json   full source text
 *   .fact-check/briefs/brief-LO-HI.json  ranked candidates per fact
 *
 * Run with `npm run fact-sources`. Network-bound and slow (a few minutes); not
 * part of CI, for the same reason `check-links.ts` is not.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparisonsSchema, type WeekRow } from '../src/lib/schema.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, '.fact-check');
const UA = 'baby-bird-factcheck/0.1 (https://github.com/tbc-personal/baby-bird)';
const RANGES: [number, number][] = [
  [2, 12],
  [13, 22],
  [23, 32],
  [33, 42],
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Doc = {
  url: string;
  source: string;
  text: string | null;
  /** The title as cited, before Wikipedia resolved any redirect. */
  requestedTitle?: string;
  resolvedTitle?: string;
  /** Set when this document stands in for a page that could not be opened. */
  substitutes?: string;
  unreachable?: string;
};

async function get(url: string, tries = 5): Promise<string | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
      if (res.ok) {
        const body = await res.text();
        // MediaWiki answers a rate limit with 200 and a plain-text body, so a
        // naive ok-check would cache the refusal as if it were an article.
        if (!/too many requests/i.test(body.slice(0, 400))) return body;
      } else if (res.status === 403 || res.status === 404) {
        return null; // A real refusal; retrying will not change it.
      }
    } catch {
      /* fall through to the backoff */
    }
    await sleep(2000 * 2 ** i); // 2s, 4s, 8s, 16s
  }
  return null;
}

function detag(html: string): string {
  return html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t\u00a0]+/g, ' ')
    .trim();
}

async function wikipedia(title: string): Promise<Doc | null> {
  const q = new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    explaintext: '1',
    format: 'json',
    redirects: '1',
    titles: decodeURIComponent(title),
  });
  const raw = await get(`https://en.wikipedia.org/w/api.php?${q}`);
  if (!raw) return null;
  interface ApiPage {
    title?: string;
    extract?: string;
  }
  let pages: Record<string, ApiPage>;
  try {
    const parsed = JSON.parse(raw) as { query?: { pages?: Record<string, ApiPage> } };
    if (!parsed.query?.pages) return null;
    pages = parsed.query.pages;
  } catch {
    return null;
  }
  for (const page of Object.values(pages)) {
    if (page.extract) {
      return {
        url: `https://en.wikipedia.org/wiki/${(page.title ?? title).replace(/ /g, '_')}`,
        source: 'Wikipedia',
        requestedTitle: title,
        resolvedTitle: page.title,
        text: page.extract,
      };
    }
  }
  return null;
}

/** Audubon slugs drop apostrophes rather than turning them into separators. */
const audubonSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function audubon(species: string): Promise<Doc | null> {
  const url = `https://www.audubon.org/field-guide/bird/${audubonSlug(species)}`;
  const raw = await get(url);
  if (!raw) return null;
  const main = raw.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? raw;
  let text = detag(main);
  if (/Find That Page/i.test(text.slice(0, 300))) return null; // Audubon's 404 body
  const starts = ['At a Glance', 'Feeding Behavior']
    .map((s) => text.indexOf(s))
    .filter((i) => i > 0);
  if (starts.length) text = text.slice(Math.min(...starts));
  text = text.replace(/\n\s*\n+/g, '\n').slice(0, 9000);
  return text.length > 300 ? { url, source: 'Audubon Field Guide', text } : null;
}

async function birdsOfTheWorld(code: string): Promise<Doc | null> {
  const url = `https://birdsoftheworld.org/bow/species/${code}/cur/introduction`;
  const raw = await get(url);
  if (!raw) return null;
  let text = detag(raw)
    .replace(/\s*\bClose\b\s*/g, ' ')
    .replace(/\s+/g, ' ');
  // Everything above the article is a Title Case nav tree with no sentence
  // punctuation; the prose starts at the first lowercase word that ends one.
  const m = text.match(/[a-z]{3,}[.,;:]\s+[A-Za-z(]/);
  if (m?.index !== undefined) text = text.slice(Math.max(0, m.index - 300));
  text = text.slice(0, 8000);
  return text.length > 500
    ? { url, source: 'Birds of the World (free introduction)', text }
    : {
        url,
        source: 'Birds of the World (free introduction)',
        text: null,
        unreachable: 'no free text past the paywall',
      };
}

async function probeBlocked(url: string): Promise<Doc> {
  let status = 'no response';
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    status = `HTTP ${res.status}`;
  } catch {
    /* keep the default */
  }
  return {
    url,
    source: 'All About Birds',
    text: null,
    unreachable: `${status} — Cornell blocks datacenter IPs at Cloudflare`,
  };
}

// ---------------------------------------------------------------- corpus

const raw: unknown = JSON.parse(
  readFileSync(resolve(ROOT, 'data/comparisons.json'), 'utf8'),
);
const weeks: WeekRow[] = comparisonsSchema
  .parse(raw)
  .weeks.filter((w) => w.facts.length > 0);

async function buildWeek(w: WeekRow) {
  const docs: Doc[] = [];
  const seen = new Set<string>();
  const push = (d: Doc | null) => {
    if (d && !seen.has(d.url.toLowerCase())) {
      seen.add(d.url.toLowerCase());
      docs.push(d);
    }
  };

  const cited = [...new Set(w.facts.flatMap((f) => f.sources))];
  const titles = new Set(
    cited.filter((u) => u.includes('wikipedia')).map((u) => u.split('/').pop() as string),
  );
  if (w.wikipediaTitle) titles.add(w.wikipediaTitle);
  for (const t of titles) {
    push(await wikipedia(t));
    await sleep(1100); // MediaWiki rate limit; serial and polite beats fast and throttled.
  }

  const species = (w.comparison ?? '').replace(/\s+egg$/i, '');
  if (w.kind !== 'seed' && species) push(await audubon(species));
  if (w.ebirdSpeciesCode) push(await birdsOfTheWorld(w.ebirdSpeciesCode));

  for (const url of cited.filter((u) => u.includes('allaboutbirds'))) {
    const blocked = await probeBlocked(url);
    const named = (url.split('/guide/')[1] ?? '').split('/')[0];
    docs.push(blocked);
    seen.add(url.toLowerCase());
    if (!named) continue;
    const aud = await audubon(named.replace(/_/g, ' '));
    if (aud) push({ ...aud, substitutes: url });
    await sleep(600);
    const wiki = await wikipedia(named);
    if (wiki) push({ ...wiki, substitutes: url });
    await sleep(1100);
  }

  const out = {
    week: w.week,
    comparison: w.comparison,
    kind: w.kind,
    scientificName: w.scientificName,
    facts: w.facts,
    documents: docs,
  };
  writeFileSync(
    resolve(OUT, 'corpus', `week-${String(w.week).padStart(2, '0')}.json`),
    JSON.stringify(out, null, 1),
  );
  const opened = docs.filter((d) => d.text);
  console.log(
    `week ${String(w.week).padStart(2)} ${(w.comparison ?? '').padEnd(26)} ` +
      `${opened.length} opened, ${docs.length - opened.length} blocked`,
  );
  return out;
}

// ---------------------------------------------------------------- briefs

const STOP = new Set(
  `a an and are as at be been but by can for from had has have in into is it its of on or that
   the their them there these they this to was were which will with when where who whom whose
   while more most other some such only own same than too very just also about after all any
   because before both during each few how no nor not now once then those through under until
   up down out over again further one two three`
    .split(/\s+/)
    .filter(Boolean),
);

const terms = (s: string) =>
  (s.toLowerCase().match(/[a-z']+|\d+(?:\.\d+)?/g) ?? []).filter(
    (t) => t.length > 2 && !STOP.has(t),
  );

const sentences = (t: string) =>
  t
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);

function buildBrief(
  lo: number,
  hi: number,
  corpus: Awaited<ReturnType<typeof buildWeek>>[],
) {
  const out = corpus
    .filter((c) => c.week >= lo && c.week <= hi)
    .map((c) => {
      const pool: { doc: Doc; s: string }[] = [];
      for (const doc of c.documents) {
        if (doc.text) for (const s of sentences(doc.text)) pool.push({ doc, s });
      }
      const df = new Map<string, number>();
      for (const { s } of pool) {
        for (const t of new Set(terms(s))) df.set(t, (df.get(t) ?? 0) + 1);
      }
      const n = Math.max(pool.length, 1);

      return {
        week: c.week,
        comparison: c.comparison,
        kind: c.kind,
        scientificName: c.scientificName,
        sourcesOpened: c.documents
          .filter((d) => d.text)
          .map((d) => ({ source: d.source, url: d.url, substitutes: d.substitutes })),
        sourcesBlocked: c.documents
          .filter((d) => !d.text)
          .map((d) => ({ url: d.url, reason: d.unreachable })),
        facts: c.facts.map((f) => {
          const want = new Set(terms(f.text));
          const scored = pool
            .map(({ doc, s }, i) => {
              let score = 0;
              for (const t of new Set(terms(s))) {
                // Rare words carry the signal; a bare number in a claim is the
                // single most useful thing to match on.
                if (want.has(t))
                  score += Math.log(n / (1 + (df.get(t) ?? 0))) + (/^\d/.test(t) ? 2 : 0);
              }
              return { score, i, doc, s };
            })
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score);

          const used: number[] = [];
          const candidates = [];
          for (const c2 of scored) {
            if (candidates.length >= 6) break;
            if (used.some((u) => Math.abs(u - c2.i) < 2)) continue;
            used.push(c2.i);
            const before = pool[c2.i - 1]?.doc === c2.doc ? pool[c2.i - 1].s : '';
            const after = pool[c2.i + 1]?.doc === c2.doc ? pool[c2.i + 1].s : '';
            candidates.push({
              score: Math.round(c2.score * 10) / 10,
              source: c2.doc.source,
              url: c2.doc.url,
              substitutes: c2.doc.substitutes,
              passage: [before, c2.s, after].filter(Boolean).join(' ').slice(0, 900),
            });
          }
          return { text: f.text, citedSources: f.sources, candidates };
        }),
      };
    });

  const path = resolve(OUT, 'briefs', `brief-${lo}-${hi}.json`);
  writeFileSync(path, JSON.stringify(out, null, 1));
  const facts = out.reduce((a, w) => a + w.facts.length, 0);
  const thin = out.flatMap((w) =>
    w.facts
      .filter((f) => f.candidates.length < 2)
      .map((f) => `w${w.week}: ${f.text.slice(0, 50)}`),
  );
  console.log(`brief-${lo}-${hi}.json: ${out.length} weeks, ${facts} facts`);
  if (thin.length) console.log(`  thin evidence: ${thin.join(' | ')}`);
}

mkdirSync(resolve(OUT, 'corpus'), { recursive: true });
mkdirSync(resolve(OUT, 'briefs'), { recursive: true });
const corpus = [];
for (const w of weeks) corpus.push(await buildWeek(w));
// A cited Wikipedia page that silently failed to download would leave a fact
// looking unverifiable when its own source was in fact available, so name the
// gaps rather than letting them pass as a verdict.
const gaps: string[] = [];
for (const c of corpus) {
  const opened = new Set(
    c.documents.flatMap((d) =>
      d.text
        ? [
            d.url.toLowerCase(),
            `https://en.wikipedia.org/wiki/${(d.resolvedTitle ?? '').replace(/ /g, '_')}`.toLowerCase(),
            // A cited title that redirects resolves to a different name, so
            // match on what was asked for as well as on what came back.
            `https://en.wikipedia.org/wiki/${(d.requestedTitle ?? '').replace(/ /g, '_')}`.toLowerCase(),
          ]
        : [],
    ),
  );
  for (const f of c.facts) {
    for (const src of f.sources) {
      if (!src.includes('wikipedia')) continue;
      if (
        !opened.has(src.toLowerCase()) &&
        !opened.has(decodeURIComponent(src).toLowerCase())
      ) {
        gaps.push(`week ${c.week}: ${src}`);
      }
    }
  }
}

for (const [lo, hi] of RANGES) buildBrief(lo, hi, corpus);
console.log(
  `\n${corpus.length} weeks, ${corpus.reduce((a, c) => a + c.facts.length, 0)} facts.`,
);
if (gaps.length) {
  console.log(
    `\n${gaps.length} cited Wikipedia page(s) did not download — re-run to fill:`,
  );
  for (const g of gaps) console.log(`  ${g}`);
}
