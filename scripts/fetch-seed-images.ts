/**
 * Fetch the curated Wikimedia Commons seed photos (ADR-003, CURATION.md task A).
 *
 * Weeks 2-6 are seeds, which the Macaulay Library has no assets for, so ADR-003
 * puts CC0/CC BY photos from Commons in the repo instead. The photos are local
 * so the app never calls Commons at runtime and the cards work offline.
 *
 * Which photo to use is a curation judgement and lives in
 * `docs/research/seed-images.json`. This script does only the mechanical half:
 * read that file, fetch each image's metadata from the Commons API, refuse any
 * licence not on ADR-003's allowed list, download at the target width, re-encode
 * with sharp, and write the `image` object into `data/comparisons.json`.
 *
 * To swap a photo, change `commonsTitle` in the picks file and re-run. Nothing
 * here is guesswork about attribution: author, licence, licence URL and source
 * URL all come from the API response, so the credit line under each card is
 * whatever Commons actually says.
 *
 * Run with `npm run seed-images`. `--dry-run` reports without writing.
 * Exit code 1 if any pick cannot be resolved or carries a disallowed licence.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ALLOWED_COMMONS_LICENSES, comparisonsSchema } from '../src/lib/schema.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'data/comparisons.json');
const PICKS = resolve(ROOT, 'docs/research/seed-images.json');
const PUBLIC = resolve(ROOT, 'public');
const UA = 'baby-bird-curation/0.1 (https://github.com/tbc-personal/baby-bird)';
const dryRun = process.argv.includes('--dry-run');

interface Pick {
  week: number;
  comparison: string;
  commonsTitle: string;
  file: string;
  altText: string;
  why: string;
  /** Trims import noise from the Commons Artist field. Must name the same author. */
  authorOverride?: string;
}
interface PicksFile {
  targetWidth: number;
  jpegQuality: number;
  picks: Pick[];
  notSourced: { week: number; comparison: string; reason: string }[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Commons returns HTML fragments in extmetadata; the credit line wants text. */
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

interface ImageInfo {
  url: string;
  descriptionurl: string;
  thumburl?: string;
  width: number;
  height: number;
  extmetadata?: Record<string, { value?: unknown }>;
}

async function commons(title: string, width: number): Promise<ImageInfo | null> {
  const q = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: String(width),
  });
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${q}`, {
        headers: { 'user-agent': UA },
      });
      if (res.ok) {
        const body = await res.text();
        // A rate limit comes back as 200 with a plain-text body.
        if (body.trimStart().startsWith('{')) {
          const parsed = JSON.parse(body) as {
            query?: { pages?: Record<string, { imageinfo?: ImageInfo[] }> };
          };
          const page = Object.values(parsed.query?.pages ?? {})[0];
          return page?.imageinfo?.[0] ?? null;
        }
      }
    } catch {
      /* fall through to the backoff */
    }
    await sleep(2000 * 2 ** i);
  }
  return null;
}

async function download(url: string): Promise<Buffer | null> {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      /* retry */
    }
    await sleep(2000 * 2 ** i);
  }
  return null;
}

const picks = JSON.parse(readFileSync(PICKS, 'utf8')) as PicksFile;
const original = readFileSync(DATA, 'utf8');
const raw: unknown = JSON.parse(original);
comparisonsSchema.parse(raw);

const data = raw as {
  weeks: {
    week: number;
    comparison: string | null;
    image: Record<string, unknown> | null;
  }[];
};
const byWeek = new Map(data.weeks.map((w) => [w.week, w]));
const problems: string[] = [];
let written = 0;

for (const pick of picks.picks) {
  const row = byWeek.get(pick.week);
  if (!row) {
    problems.push(`week ${pick.week} is not in the data file`);
    continue;
  }
  if (row.comparison !== pick.comparison) {
    // A renamed comparison means the pick may no longer be the right subject.
    problems.push(
      `week ${pick.week}: picks file says "${pick.comparison}", data says "${row.comparison ?? 'null'}"`,
    );
    continue;
  }

  const info = await commons(pick.commonsTitle, picks.targetWidth);
  if (!info) {
    problems.push(
      `week ${pick.week}: could not read ${pick.commonsTitle} from the Commons API`,
    );
    continue;
  }
  const meta = info.extmetadata ?? {};
  const license = plain(meta.LicenseShortName?.value);
  const author = plain(meta.Artist?.value);
  if (!license || !(ALLOWED_COMMONS_LICENSES as readonly string[]).includes(license)) {
    problems.push(
      `week ${pick.week}: licence "${license ?? 'unknown'}" is not on ADR-003's allowed list`,
    );
    continue;
  }
  if (!author) {
    problems.push(
      `week ${pick.week}: Commons gives no author, and attribution is required`,
    );
    continue;
  }
  // An override may tidy the Artist string, never redirect the credit: it has
  // to be a prefix of what Commons says, so it cannot name somebody else.
  let credited = author;
  if (pick.authorOverride) {
    const normalise = (v: string) =>
      v
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    if (!normalise(author).startsWith(normalise(pick.authorOverride))) {
      problems.push(
        `week ${pick.week}: authorOverride "${pick.authorOverride}" is not a prefix of the Commons author "${author}"`,
      );
      continue;
    }
    credited = pick.authorOverride;
  }
  // Public-domain files carry no licence URL. The credit line still needs a
  // link, and the CC Public Domain Mark is the standard one for such works.
  const licenseUrl =
    plain(meta.LicenseUrl?.value) ?? 'https://creativecommons.org/publicdomain/mark/1.0/';

  const bytes = await download(info.thumburl ?? info.url);
  if (!bytes) {
    problems.push(`week ${pick.week}: download failed`);
    continue;
  }
  const out = resolve(PUBLIC, pick.file);
  const encoded = await sharp(bytes)
    .resize({ width: picks.targetWidth, withoutEnlargement: true })
    .jpeg({ quality: picks.jpegQuality, mozjpeg: true })
    .toBuffer();

  if (!dryRun) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, encoded);
  }

  row.image = {
    provider: 'commons',
    mlAssetId: null,
    fallbackMlAssetId: null,
    embedUrl: null,
    credit: null,
    altText: pick.altText,
    file: pick.file,
    author: credited,
    license,
    licenseUrl,
    sourceUrl: info.descriptionurl,
  };
  written++;
  console.log(
    `week ${String(pick.week).padStart(2)} ${pick.comparison.padEnd(22)} ` +
      `${String(Math.round(encoded.length / 1024)).padStart(4)} KB  ${license}  ${credited.slice(0, 40)}`,
  );
  await sleep(1200); // Commons rate limit.
}

for (const skipped of picks.notSourced) {
  console.log(
    `week ${String(skipped.week).padStart(2)} ${skipped.comparison} — not sourced`,
  );
}

if (problems.length) {
  console.error(`\n${problems.length} pick(s) failed:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

comparisonsSchema.parse(data);

if (dryRun) {
  console.log(`\n--dry-run: ${written} row(s) would be written.`);
} else {
  writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
  console.log(`\n${written} image row(s) written to ${DATA}.`);
}
