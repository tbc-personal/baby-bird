/**
 * Shortlist Wikimedia Commons candidates for the bird and egg weeks (ADR-003).
 *
 * ADR-003 originally sent weeks 7-42 to the Macaulay Library and kept Commons
 * for the seed weeks. The Macaulay route turned out to be unshippable, so every
 * week now needs a Commons file, and the expensive half of that is *finding*
 * one: Commons holds tens of thousands of bird photos, most of them wrong for a
 * 150px-tall strip that gets centre-cropped.
 *
 * This script does the finding mechanically so the only human step left is
 * looking at a handful of thumbnails. For each week it walks the species'
 * Commons category, drops anything the project cannot ship (wrong licence, no
 * author, too small, an engraving rather than a photograph), scores what's left
 * on signals the API actually reports, and writes a ranked shortlist.
 *
 * It never picks. The chosen file goes in `docs/research/commons-images.json`
 * by hand, and `npm run commons-images` applies it. That split is deliberate:
 * scoring is repeatable and belongs in code, judging a photograph is not.
 *
 *   npm run survey-commons -- --weeks 7-13     shortlist those weeks
 *   npm run survey-commons -- --weeks 7-13 --sheet   ...and write the review sheet
 *   npm run survey-commons -- --refresh        ignore the on-disk API cache
 *
 * Responses are cached under `.commons-survey/`, so re-running to re-score or
 * re-render the sheet costs no network at all.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ALLOWED_COMMONS_LICENSES, comparisonsSchema } from '../src/lib/schema.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'data/comparisons.json');
const CACHE = resolve(ROOT, '.commons-survey');
const UA = 'baby-bird-curation/0.1 (https://github.com/tbc-personal/baby-bird)';

/** The card crops to a 150px-tall strip, so shortlists want wide files. */
const MIN_WIDTH = 1000;
/** How many files to pull metadata for per week. Bounds the request count. */
const MAX_CANDIDATES = 200;
/** How many survive into the shortlist. */
const SHORTLIST = 6;

// ---------------------------------------------------------------- exclusions

/**
 * Not photographs of a living bird. The 19th-century book plates are the ones
 * that matter: Commons species categories are full of them, they carry clean
 * public-domain licences, and a coverage count that includes them is a lie.
 */
const NOT_A_PHOTOGRAPH =
  /\b(plate|lithograph|engrav|etching|drawing|drawn|illustration|painting|painted|watercolou?r|sketch|woodcut|chromolith|print|artwork|diagram|icon|logo|stamp|coin|banknote|cover|book|handbook|manual|birds of|iconograph|nederlandsche|naumann|gould|audubon)\b/i;
/** Dead, mounted, or otherwise not what a reader should be shown. */
const NOT_A_LIVE_BIRD =
  /\b(taxiderm|specimen|skeleton|skull|bone|mount(ed)?|museum|collection|dead|roadkill|carcass|wing detail|feather detail|pellet|dropping|scat|track|footprint|nhmuk|naturalis|zoolog(y|ical) museum)\b/i;
/** Not the subject: maps, sound, charts. */
const NOT_THE_SUBJECT =
  /\b(map|distribution|range|sonogram|spectrogram|waveform|chart|graph|sign|signage|plaque|banner|mural|statue|sculpture|carving|decoy|toy|model)\b/i;
/** Captive birds read wrong in a card about wild species. */
const CAPTIVE =
  /\b(zoo|aviary|captive|falconry|falconer|cage|caged|rehab|banded|banding|ringed|ringing|in hand|held|handler|glove)\b/i;

const EGG_SUBJECT = /\b(egg|eggs|nest|nests|nesting|clutch|brood)\b/i;

// ------------------------------------------------------------------ plumbing

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Commons puts HTML fragments in extmetadata; scoring wants plain text. */
function plain(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

/**
 * GET with the project's usual backoff. Wikimedia rate-limits shared datacentre
 * addresses and answers a limited request with a 200 and a plain-text body, so
 * a status check alone is not enough — the body has to parse as JSON.
 */
async function api(params: Record<string, string>, refresh: boolean): Promise<unknown> {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
    format: 'json',
    formatversion: '2',
    ...params,
  })}`;
  const key = resolve(CACHE, `${createHash('sha1').update(url).digest('hex')}.json`);
  if (!refresh && existsSync(key)) return JSON.parse(readFileSync(key, 'utf8'));

  for (let i = 0; i < 9; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      const body = await res.text();
      if (res.ok && body.trimStart().startsWith('{')) {
        mkdirSync(CACHE, { recursive: true });
        writeFileSync(key, body);
        await sleep(1100);
        return JSON.parse(body);
      }
    } catch {
      /* fall through to the backoff */
    }
    await sleep(Math.min(2500 * 2 ** i, 60_000));
  }
  throw new Error(`Commons API gave up on ${url}`);
}

interface CategoryMember {
  title: string;
  ns: number;
}

async function categoryMembers(
  category: string,
  type: 'file' | 'subcat',
  refresh: boolean,
): Promise<string[]> {
  const titles: string[] = [];
  let cont: string | undefined;
  do {
    const page = (await api(
      {
        action: 'query',
        list: 'categorymembers',
        cmtitle: category,
        cmtype: type,
        cmlimit: '500',
        ...(cont ? { cmcontinue: cont } : {}),
      },
      refresh,
    )) as {
      query?: { categorymembers?: CategoryMember[] };
      continue?: { cmcontinue?: string };
    };
    for (const m of page.query?.categorymembers ?? []) titles.push(m.title);
    cont = page.continue?.cmcontinue;
  } while (cont && titles.length < 2000);
  return titles;
}

interface FileInfo {
  title: string;
  url: string;
  descriptionurl: string;
  thumburl?: string;
  width: number;
  height: number;
  mime: string;
  license: string | null;
  author: string | null;
  description: string | null;
  categories: string[];
}

async function fileInfo(titles: string[], refresh: boolean): Promise<FileInfo[]> {
  const out: FileInfo[] = [];
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const page = (await api(
      {
        action: 'query',
        titles: batch.join('|'),
        prop: 'imageinfo|categories',
        iiprop: 'url|size|mime|extmetadata',
        iiurlwidth: '400',
        cllimit: '500',
      },
      refresh,
    )) as {
      query?: {
        pages?: {
          title: string;
          imageinfo?: {
            url: string;
            descriptionurl: string;
            thumburl?: string;
            width: number;
            height: number;
            mime: string;
            extmetadata?: Record<string, { value?: unknown }>;
          }[];
          categories?: { title: string }[];
        }[];
      };
    };
    for (const p of page.query?.pages ?? []) {
      const info = p.imageinfo?.[0];
      if (!info) continue;
      const meta = info.extmetadata ?? {};
      out.push({
        title: p.title,
        url: info.url,
        descriptionurl: info.descriptionurl,
        thumburl: info.thumburl,
        width: info.width,
        height: info.height,
        mime: info.mime,
        license: plain(meta.LicenseShortName?.value),
        author: plain(meta.Artist?.value),
        description: plain(meta.ImageDescription?.value),
        categories: (p.categories ?? []).map((c) => c.title),
      });
    }
  }
  return out;
}

// ------------------------------------------------------------------- scoring

interface Scored extends FileInfo {
  score: number;
  notes: string[];
}

function score(file: FileInfo, kind: 'egg' | 'bird'): Scored {
  const notes: string[] = [];
  const haystack = [file.title, file.description ?? '', file.categories.join(' ')].join(
    ' ',
  );
  const cats = file.categories.join(' ');
  // What the *file* is, as opposed to what its caption talks about. Commons
  // descriptions often carry a species blurb — "it feeds on fish ... lays three
  // to five eggs" — under a photograph of an adult bird, which put six adult
  // Great Blue Herons at the top of week 12's egg shortlist. Titles and
  // categories describe the file itself, so the egg test uses only those.
  const subject = [file.title, cats].join(' ');
  let points = 0;

  if (/Featured pictures on Wikimedia Commons/i.test(cats)) {
    points += 120;
    notes.push('featured picture');
  }
  if (/Quality images/i.test(cats)) {
    points += 70;
    notes.push('quality image');
  }
  if (/Valued images/i.test(cats)) {
    points += 35;
    notes.push('valued image');
  }

  // The card crops to a 150px strip, so a tall file loses most of its subject.
  const aspect = file.width / file.height;
  if (aspect >= 1.3) points += 30;
  else if (aspect >= 1.0) points += 10;
  else {
    points -= 45;
    notes.push('portrait — crops badly in the strip');
  }

  points += Math.min(file.width, 5000) / 250;

  if (kind === 'bird' && CAPTIVE.test(haystack)) {
    points -= 55;
    notes.push('reads as captive or in-hand');
  }
  if (kind === 'bird' && NOT_A_LIVE_BIRD.test(haystack)) {
    points -= 120;
    notes.push('not a live bird');
  }
  if (kind === 'egg') {
    // "Nest" alone is not an egg week. The first pass over weeks 7-13 put six
    // photographs of an adult House Wren sitting on its nest box at the top of
    // the shortlist, because the word nest was in every caption. An egg week
    // wants, in order: a nest with the clutch visible, a collection specimen,
    // and only then a nest whose caption does not say whether eggs are in it.
    const egg = /\begg/i.test(subject);
    const nest = /\b(nest|clutch|brood)/i.test(subject);
    if (egg && nest) {
      points += 60;
      notes.push('nest with a clutch');
    } else if (egg) {
      points += 25;
      notes.push('egg, probably a specimen');
    } else if (nest) {
      points -= 80;
      notes.push('nest, but the caption never mentions an egg');
    } else {
      points -= 200;
      notes.push('no egg or nest in the subject');
    }
  }
  return { ...file, score: Math.round(points), notes };
}

/** Files this project cannot ship at all, whatever they look like. */
function shippable(file: FileInfo, kind: 'egg' | 'bird'): string | null {
  if (!/^image\/(jpeg|png)$/.test(file.mime)) return `mime ${file.mime}`;
  if (file.width < MIN_WIDTH) return `${file.width}px wide`;
  if (!file.license) return 'no licence reported';
  if (!(ALLOWED_COMMONS_LICENSES as readonly string[]).includes(file.license))
    return `licence ${file.license}`;
  if (!file.author) return 'no author reported';
  const haystack = [file.title, file.description ?? '', file.categories.join(' ')].join(
    ' ',
  );
  if (NOT_A_PHOTOGRAPH.test(haystack)) return 'not a photograph';
  if (NOT_THE_SUBJECT.test(haystack)) return 'not the subject';
  // Egg weeks want museum clutch trays; bird weeks do not want mounted skins.
  if (kind === 'bird' && NOT_A_LIVE_BIRD.test(haystack)) return 'not a live bird';
  return null;
}

// ---------------------------------------------------------------------- main

const args = process.argv.slice(2);
const refresh = args.includes('--refresh');
const wantSheet = args.includes('--sheet');
const weekArg = args[args.indexOf('--weeks') + 1];

function parseWeeks(spec: string | undefined): number[] | null {
  if (!spec || spec.startsWith('--')) return null;
  const weeks = new Set<number>();
  for (const part of spec.split(',')) {
    const range = /^(\d+)-(\d+)$/.exec(part.trim());
    if (range) {
      for (let w = Number(range[1]); w <= Number(range[2]); w++) weeks.add(w);
    } else if (/^\d+$/.test(part.trim())) {
      weeks.add(Number(part.trim()));
    }
  }
  return [...weeks].sort((a, b) => a - b);
}

const raw: unknown = JSON.parse(readFileSync(DATA, 'utf8'));
comparisonsSchema.parse(raw);
const data = raw as {
  weeks: {
    week: number;
    kind: string | null;
    comparison: string | null;
    scientificName: string | null;
    image: { provider?: string | null; file?: string | null } | null;
  }[];
};

const requested = parseWeeks(weekArg);
const weeks = data.weeks.filter(
  (w) =>
    (w.kind === 'bird' || w.kind === 'egg') &&
    w.scientificName &&
    (requested ? requested.includes(w.week) : !w.image?.file),
);

if (!weeks.length) {
  console.error('No weeks matched. Pass --weeks 7-13, or check the data file.');
  process.exit(1);
}

interface WeekSurvey {
  week: number;
  kind: string;
  comparison: string;
  scientificName: string;
  category: string;
  pool: number;
  rejected: Record<string, number>;
  candidates: {
    commonsTitle: string;
    sourceUrl: string;
    thumbUrl: string | null;
    width: number;
    height: number;
    license: string;
    author: string;
    description: string | null;
    score: number;
    notes: string[];
  }[];
}

const survey: WeekSurvey[] = [];

const failed: number[] = [];

for (const week of weeks) {
  try {
    const kind = week.kind as 'egg' | 'bird';
    const category = `Category:${week.scientificName!}`;
    const subcats = await categoryMembers(category, 'subcat', refresh).catch(() => []);
    const direct = await categoryMembers(category, 'file', refresh).catch(() => []);

    // One level of subcategories. Egg weeks live in them ("Nests of ...", "Eggs
    // of ..."); bird weeks are better off without them, since most subcategories
    // are plates, museum skins, or a single locality's photos.
    const wanted = subcats.filter((c) =>
      kind === 'egg'
        ? EGG_SUBJECT.test(c)
        : /\b(adult|flight|portrait|male|female)\b/i.test(c),
    );
    const fromSubcat: string[] = [];
    for (const sub of wanted) {
      fromSubcat.push(...(await categoryMembers(sub, 'file', refresh).catch(() => [])));
    }

    // A file in "Nests of Turdus migratorius" is on-subject whatever it is called;
    // a file sitting loose in the species category only counts if its own title
    // says egg or nest, or the whole category floods the shortlist with portraits.
    let titles =
      kind === 'egg'
        ? [...fromSubcat, ...direct.filter((t) => EGG_SUBJECT.test(t))]
        : [...direct, ...fromSubcat];

    // Thin species — Wood Thrush and Great Blue Heron were the two that failed the
    // first coverage survey — have no egg subcategory worth the name. Fall back to
    // a site-wide search before declaring the week unsourceable.
    if (kind === 'egg') {
      for (const term of [
        `${week.scientificName!} egg`,
        `${week.comparison!.replace(/ egg$/i, '')} nest eggs`,
        // The two museum egg collections that photograph well and licence cleanly.
        `${week.scientificName!} MHNT`,
        `${week.scientificName!} MWNH`,
      ]) {
        const hits = (await api(
          {
            action: 'query',
            list: 'search',
            srsearch: term,
            srnamespace: '6',
            srlimit: '40',
          },
          refresh,
        ).catch(() => ({}))) as { query?: { search?: { title: string }[] } };
        // No title filter here. The museum egg collections file under an accession
        // number ("Troglodytes aedon MHNT.ZOO.2010.11.19.1.jpg") and say "egg"
        // only in the description, so filtering on the title drops exactly the
        // files this search exists to find. Scoring rejects the off-subject ones.
        titles.push(...(hits.query?.search ?? []).map((h) => h.title));
      }
    }

    titles = [...new Set(titles)].slice(0, MAX_CANDIDATES);

    const files = await fileInfo(titles, refresh);
    const rejected: Record<string, number> = {};
    const kept: Scored[] = [];
    for (const file of files) {
      const why = shippable(file, kind);
      if (why) {
        const bucket = why
          .replace(/\d+px wide/, 'too small')
          .replace(/^licence .*/, 'licence');
        rejected[bucket] = (rejected[bucket] ?? 0) + 1;
        continue;
      }
      const s = score(file, kind);
      if (s.notes.includes('no egg or nest in the subject') || s.score < -100) {
        rejected['scored out'] = (rejected['scored out'] ?? 0) + 1;
        continue;
      }
      kept.push(s);
    }
    kept.sort((a, b) => b.score - a.score);

    survey.push({
      week: week.week,
      kind,
      comparison: week.comparison!,
      scientificName: week.scientificName!,
      category,
      pool: files.length,
      rejected,
      candidates: kept.slice(0, SHORTLIST).map((c) => ({
        commonsTitle: c.title,
        sourceUrl: c.descriptionurl,
        thumbUrl: c.thumburl ?? null,
        width: c.width,
        height: c.height,
        license: c.license!,
        author: c.author!,
        description: c.description ? c.description.slice(0, 240) : null,
        score: c.score,
        notes: c.notes,
      })),
    });

    console.log(
      `week ${String(week.week).padStart(2)} ${week.comparison!.padEnd(28)} ` +
        `pool ${String(files.length).padStart(3)} → ${kept.length} shippable, ` +
        `top ${kept[0]?.score ?? 0}`,
    );
  } catch (err) {
    // Wikimedia rate-limits this address hard enough that a week can run out of
    // retries. Losing one week is survivable; losing the eight already surveyed
    // to an exception on the ninth is not. Responses are cached, so re-running
    // the same command picks up where this left off.
    failed.push(week.week);
    console.error(
      `week ${String(week.week).padStart(2)} FAILED: ${(err as Error).message.slice(0, 90)}`,
    );
  }
}

const range = requested ? `${requested[0]}-${requested[requested.length - 1]}` : 'all';
const out = resolve(ROOT, `docs/research/commons-survey-${range}.json`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify({ generated: new Date().toISOString(), survey }, null, 2) + '\n',
);
console.log(`\nShortlists written to ${out}.`);
if (failed.length) {
  console.error(
    `Incomplete: weeks ${failed.join(', ')} ran out of retries. Re-run the same command.`,
  );
}

if (wantSheet) {
  const sheetPath = resolve(ROOT, `docs/research/commons-shortlist-${range}.md`);
  const lines: string[] = [
    `# Commons shortlist — weeks ${range}`,
    '',
    'Generated by `npm run survey-commons`. Every candidate below is already',
    'licence-checked against ADR-003, at least 1000px wide, and has a named author,',
    'so any of them is shippable. What is left is the part a script cannot do:',
    'deciding which photograph is the right one.',
    '',
    'The card crops each photo to a **150px-tall strip across the full card width**,',
    'so a shot whose subject sits dead centre and reads at a glance beats a prettier',
    'one that loses its bird to the crop.',
    '',
    'Reply with the week and the letter, e.g. "7A, 8C, 9 none of these".',
    '',
  ];
  for (const w of survey) {
    lines.push(`## Week ${w.week} — ${w.comparison}`);
    lines.push('');
    lines.push(
      `*${w.scientificName}* · [${w.category}](https://commons.wikimedia.org/wiki/${encodeURIComponent(w.category)}) · ` +
        `${w.pool} files examined, ${w.candidates.length} shortlisted`,
    );
    lines.push('');
    if (!w.candidates.length) {
      lines.push('**Nothing shippable found.** Rejections: ' + JSON.stringify(w.rejected));
      lines.push('');
      continue;
    }
    w.candidates.forEach((c, i) => {
      const letter = String.fromCharCode(65 + i);
      lines.push(`### ${w.week}${letter}`);
      lines.push('');
      if (c.thumbUrl) lines.push(`![${w.comparison} candidate ${letter}](${c.thumbUrl})`);
      lines.push('');
      lines.push(
        `[${c.commonsTitle.replace(/^File:/, '')}](${c.sourceUrl}) · ${c.width}×${c.height} · ` +
          `${c.license} · ${c.author}${c.notes.length ? ` · ${c.notes.join(', ')}` : ''}`,
      );
      if (c.description) {
        lines.push('');
        lines.push(`> ${c.description}`);
      }
      lines.push('');
    });
  }
  writeFileSync(sheetPath, lines.join('\n'));
  console.log(`Review sheet written to ${sheetPath}.`);
}
