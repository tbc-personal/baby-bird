/**
 * Render curated photographs the way the card will crop them (ADR-003).
 *
 * The card's photo strip is a wide, short letterbox — 150px tall across the
 * full card width, nearer 2.8:1 than the 16:9 a review sheet's thumbnails
 * suggest. A centred crop therefore decapitates any bird sitting in the upper
 * part of its frame, and neither the shortlist's score nor its thumbnail shows
 * that happening. Two picks reached `commons-images.json` with their heads cut
 * off before this existed, and week 10's card showed an empty nest for a day
 * because the robin's eggs sit in the bottom third.
 *
 * Each photo is drawn whole, letterboxed, with the window the card actually
 * takes marked in yellow and a percentage scale down the side. Read off where
 * the bird sits and put that in the pick's `objectPosition`.
 *
 *   npm run crop-preview                        every curated week
 *   npm run crop-preview -- --weeks 33-42       just those
 *   npm run crop-preview -- --compare 200       also draw a 200px strip, in cyan
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
/** `--screen-max` is 460px and the e2e viewport is 420px. */
const CARD_WIDTH = 420;
/** `.photo__img` height in `src/components/Photo.css`. */
const STRIP_HEIGHT = 150;
const TILE_W = 360;
const COLS = 3;
const PER_SHEET = 12;

const args = process.argv.slice(2);
const weekArg = args[args.indexOf('--weeks') + 1];
/**
 * `--compare <px>` draws a second window at that strip height, in cyan, and
 * reports how much more of each photograph it would show — for answering "is a
 * taller strip worth it" with numbers rather than an opinion.
 */
const compareArg = args[args.indexOf('--compare') + 1];
const compareHeight =
  compareArg && !compareArg.startsWith('--') ? Number(compareArg) : null;

const wanted = new Set<number>();
if (weekArg && !weekArg.startsWith('--')) {
  for (const part of weekArg.split(',')) {
    const range = /^(\d+)-(\d+)$/.exec(part.trim());
    if (range) for (let w = Number(range[1]); w <= Number(range[2]); w++) wanted.add(w);
    else if (/^\d+$/.test(part.trim())) wanted.add(Number(part.trim()));
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

function overlay(
  w: number,
  h: number,
  shown: { top: number; height: number },
  alt: { top: number; height: number } | null,
  label: string,
) {
  const ticks = [10, 20, 30, 40, 50, 60, 70, 80, 90]
    .map((pct) => {
      const y = (pct / 100) * h;
      return (
        `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#fff" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="3 4"/>` +
        `<text x="3" y="${y - 2}" font-family="monospace" font-size="10" fill="#fff" fill-opacity="0.85">${pct}</text>`
      );
    })
    .join('');
  const dim = alt ?? shown;
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="0" y="0" width="${w}" height="${dim.top}" fill="#000" fill-opacity="0.55"/>` +
      `<rect x="0" y="${dim.top + dim.height}" width="${w}" height="${h - dim.top - dim.height}" fill="#000" fill-opacity="0.55"/>` +
      (alt
        ? `<rect x="1.5" y="${alt.top + 1.5}" width="${w - 3}" height="${alt.height - 3}" fill="none" stroke="#28e0e0" stroke-width="2"/>`
        : '') +
      `<rect x="0.5" y="${shown.top + 0.5}" width="${w - 1}" height="${shown.height - 1}" fill="none" stroke="#ffd400" stroke-width="2"/>` +
      ticks +
      `<text x="${w - 4}" y="13" text-anchor="end" font-family="monospace" font-size="12" fill="#ffd400">${label}</text>` +
      `</svg>`,
  );
}

mkdirSync(OUT, { recursive: true });
const tiles: Buffer[] = [];
const gains: { week: number; comparison: string; now: number; then: number }[] = [];

for (const row of rows) {
  const file = resolve(ROOT, 'public', row.image!.file!);
  const meta = await sharp(file).metadata();
  const aspect = (meta.width ?? 1) / (meta.height ?? 1);
  const tileH = Math.round(TILE_W / aspect);
  const base = await sharp(file).resize(TILE_W, tileH, { fit: 'fill' }).toBuffer();

  const pos = row.image!.objectPosition ?? null;
  const pctMatch = pos ? /(\d+(?:\.\d+)?)%/.exec(pos) : null;
  const focus = pctMatch ? Number(pctMatch[1]) / 100 : 0.5;

  /** A strip `px` tall shows this share of the photograph's height. */
  const shareOf = (px: number) => Math.min(1, (px * aspect) / CARD_WIDTH);
  const windowFor = (px: number) => {
    const height = Math.min(tileH, Math.round(shareOf(px) * tileH));
    return { top: Math.round((tileH - height) * focus), height };
  };

  const label = `wk ${row.week}${pos ? ` @ ${pos}` : ''}`;
  tiles.push(
    await sharp(base)
      .composite([
        {
          input: overlay(
            TILE_W,
            tileH,
            windowFor(STRIP_HEIGHT),
            compareHeight ? windowFor(compareHeight) : null,
            label,
          ),
          top: 0,
          left: 0,
        },
      ])
      .toBuffer(),
  );
  gains.push({
    week: row.week,
    comparison: row.comparison ?? '',
    now: shareOf(STRIP_HEIGHT),
    then: compareHeight ? shareOf(compareHeight) : 0,
  });
}

for (let start = 0, sheet = 1; start < tiles.length; start += PER_SHEET, sheet++) {
  const page = tiles.slice(start, start + PER_SHEET);
  const heights = await Promise.all(
    page.map(async (t) => (await sharp(t).metadata()).height ?? 0),
  );
  const rowH = Math.max(...heights);
  const out = resolve(OUT, `sheet-${sheet}.jpg`);
  await sharp({
    create: {
      width: TILE_W * COLS,
      height: rowH * Math.ceil(page.length / COLS),
      channels: 3,
      background: '#1a1a1a',
    },
  })
    .composite(
      page.map((input, i) => ({
        input,
        left: (i % COLS) * TILE_W,
        top: Math.floor(i / COLS) * rowH,
      })),
    )
    .jpeg({ quality: 82 })
    .toFile(out);
  console.log(out);
}

if (compareHeight) {
  console.log(
    `\nShare of each photograph's height visible, ${STRIP_HEIGHT}px → ${compareHeight}px:\n`,
  );
  let fullyVisible = 0;
  for (const g of gains.sort((a, b) => a.week - b.week)) {
    if (g.then >= 0.999) fullyVisible++;
    console.log(
      `  wk ${String(g.week).padStart(2)} ${g.comparison.padEnd(26)} ` +
        `${(g.now * 100).toFixed(0).padStart(3)}% → ${(g.then * 100).toFixed(0).padStart(3)}%` +
        `  (+${((g.then - g.now) * 100).toFixed(0)} points)`,
    );
  }
  const mean = (k: 'now' | 'then') => gains.reduce((t, g) => t + g[k], 0) / gains.length;
  console.log(
    `\n  mean ${(mean('now') * 100).toFixed(0)}% → ${(mean('then') * 100).toFixed(0)}%` +
      `, and ${fullyVisible} of ${gains.length} photographs would be fully visible.`,
  );
}
