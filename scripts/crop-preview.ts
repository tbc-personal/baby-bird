/**
 * Render curated photographs the way the card will crop them (ADR-003).
 *
 * The card's photo strip is a wide, short letterbox — 150px tall across the
 * full card width, nearer 2.6:1 than the 16:9 a review sheet's thumbnails
 * suggest. A centred crop therefore decapitates any bird sitting in the upper
 * part of its frame, and neither the shortlist's score nor its thumbnail shows
 * that happening. Two picks reached `commons-images.json` with their heads cut
 * off before this existed.
 *
 * Each photo is drawn whole, letterboxed, with the crop window the card will
 * actually take marked on it and a percentage scale down the side. Read off
 * where the bird sits and put that in the pick's `objectPosition`.
 *
 *   npm run crop-preview                     every curated week
 *   npm run crop-preview -- --weeks 33-42    just those
 *
 * Writes numbered sheets to `.crop-preview/`, which is git-ignored: they are a
 * curation aid, not a deliverable.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { comparisonsSchema } from '../src/lib/schema.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, '.crop-preview');
/** The strip's aspect on a phone. Wider screens are wider still. */
const CARD_ASPECT = 2.6;
const TILE_W = 360;
const COLS = 3;
const PER_SHEET = 12;

const args = process.argv.slice(2);
const weekArg = args[args.indexOf('--weeks') + 1];
const wanted = new Set<number>();
if (weekArg && !weekArg.startsWith('--')) {
  for (const part of weekArg.split(',')) {
    const range = /^(\d+)-(\d+)$/.exec(part.trim());
    if (range) for (let w = +range[1]; w <= +range[2]; w++) wanted.add(w);
    else if (/^\d+$/.test(part.trim())) wanted.add(+part.trim());
  }
}

const raw: unknown = JSON.parse(
  readFileSync(resolve(ROOT, 'data/comparisons.json'), 'utf8'),
);
comparisonsSchema.parse(raw);
const data = raw as {
  weeks: {
    week: number;
    comparison: string | null;
    image: { file?: string | null; objectPosition?: string | null } | null;
  }[];
};

const rows = data.weeks.filter(
  (w) => w.image?.file && (wanted.size === 0 || wanted.has(w.week)),
);
if (!rows.length) {
  console.error('No curated weeks matched.');
  process.exit(1);
}

/** The percentage scale and the crop window, drawn over the photo. */
function overlay(w: number, h: number, cropTop: number, cropHeight: number, label: string) {
  const ticks = [10, 20, 30, 40, 50, 60, 70, 80, 90]
    .map((pct) => {
      const y = (pct / 100) * h;
      return (
        `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#fff" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="3 4"/>` +
        `<text x="3" y="${y - 2}" font-family="monospace" font-size="10" fill="#fff" fill-opacity="0.85">${pct}</text>`
      );
    })
    .join('');
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="0" y="0" width="${w}" height="${cropTop}" fill="#000" fill-opacity="0.55"/>` +
      `<rect x="0" y="${cropTop + cropHeight}" width="${w}" height="${h - cropTop - cropHeight}" fill="#000" fill-opacity="0.55"/>` +
      `<rect x="0.5" y="${cropTop + 0.5}" width="${w - 1}" height="${cropHeight - 1}" fill="none" stroke="#ffd400" stroke-width="2"/>` +
      ticks +
      `<text x="${w - 4}" y="13" text-anchor="end" font-family="monospace" font-size="12" fill="#ffd400">${label}</text>` +
      `</svg>`,
  );
}

mkdirSync(OUT, { recursive: true });
const tiles: { buf: Buffer; label: string }[] = [];

for (const row of rows) {
  const file = resolve(ROOT, 'public', row.image!.file!);
  const meta = await sharp(file).metadata();
  const tileH = Math.round((TILE_W * (meta.height ?? 1)) / (meta.width ?? 1));
  const base = await sharp(file).resize(TILE_W, tileH, { fit: 'fill' }).toBuffer();

  // Where the card's window lands, honouring any objectPosition already set.
  const cropHeight = Math.min(tileH, Math.round(TILE_W / CARD_ASPECT));
  const pos = row.image!.objectPosition ?? null;
  const pctMatch = pos ? /(\d+(?:\.\d+)?)%/.exec(pos) : null;
  const focus = pctMatch ? Number(pctMatch[1]) / 100 : 0.5;
  const cropTop = Math.round((tileH - cropHeight) * focus);

  const label = `wk ${row.week}${pos ? ` @ ${pos}` : ''}`;
  tiles.push({
    buf: await sharp(base)
      .composite([
        { input: overlay(TILE_W, tileH, cropTop, cropHeight, label), top: 0, left: 0 },
      ])
      .toBuffer(),
    label,
  });
  console.log(`${label.padEnd(22)} ${row.comparison}`);
}

for (let start = 0, sheet = 1; start < tiles.length; start += PER_SHEET, sheet++) {
  const page = tiles.slice(start, start + PER_SHEET);
  const heights = await Promise.all(
    page.map(async (t) => (await sharp(t.buf).metadata()).height ?? 0),
  );
  const rowH = Math.max(...heights);
  const rowCount = Math.ceil(page.length / COLS);
  const composites = page.map((t, i) => ({
    input: t.buf,
    left: (i % COLS) * TILE_W,
    top: Math.floor(i / COLS) * rowH,
  }));
  const out = resolve(OUT, `sheet-${sheet}.jpg`);
  await sharp({
    create: {
      width: TILE_W * COLS,
      height: rowH * rowCount,
      channels: 3,
      background: '#1a1a1a',
    },
  })
    .composite(composites)
    .jpeg({ quality: 82 })
    .toFile(out);
  console.log(`\n${out}`);
}
