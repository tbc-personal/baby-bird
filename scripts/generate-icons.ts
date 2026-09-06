/**
 * generate-icons.ts
 *
 * Rasterises the Nestling puffin mark (public/favicon.svg) into every PNG the
 * app ships in public/icons/. Idempotent and CI-safe: it always re-renders
 * from the same source SVG, so re-running produces byte-identical output,
 * and it exits non-zero on any sharp failure or empty file so a broken
 * render fails the build instead of shipping a 0-byte icon.
 *
 * Usage: tsx scripts/generate-icons.ts   (wired up as `npm run icons`)
 */

import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FAVICON_SVG_PATH = join(ROOT, 'public', 'favicon.svg');
const ICONS_DIR = join(ROOT, 'public', 'icons');

/** The Puffin skin's ground colour — used as the opaque backdrop for every PNG. */
const GROUND = '#F6F4EF';

interface IconSpec {
  readonly name: string;
  readonly size: number;
  /** Fraction (0-1] the mark is scaled to before centring on the canvas. 1 = full bleed. */
  readonly markScale: number;
}

// Plain icons render the source SVG edge-to-edge (markScale 1). The maskable
// icon must additionally survive being clipped by an arbitrary circle/squircle
// mask, per the W3C manifest maskable-icon spec: the OS-safe area is the
// inner circle whose diameter is 80% of the full canvas. Anything outside
// that circle may be cropped away on some platforms. To guarantee the bird
// is never clipped, we shrink the whole mark to 60% (comfortably inside the
// 80% safe circle, leaving margin for rounding/anti-aliasing) and centre it,
// letting the ground colour fill the rest of the canvas out to the edges.
const MASKABLE_SAFE_SCALE = 0.6;

const ICON_SPECS: readonly IconSpec[] = [
  { name: 'icon-192.png', size: 192, markScale: 1 },
  { name: 'icon-512.png', size: 512, markScale: 1 },
  { name: 'icon-512-maskable.png', size: 512, markScale: MASKABLE_SAFE_SCALE },
  { name: 'apple-touch-icon.png', size: 180, markScale: 1 },
  { name: 'favicon-32.png', size: 32, markScale: 1 },
  { name: 'favicon-16.png', size: 16, markScale: 1 },
];

/** Source viewBox of public/favicon.svg. */
const VIEWBOX = 512;

/**
 * Reads the source favicon.svg and, when markScale < 1, rewrites it so the
 * bird artwork (everything after the full-bleed ground <rect>) is scaled
 * down and re-centred, while the ground rect still fills the whole canvas.
 * This keeps a single source of truth for the artwork instead of
 * duplicating path data for the maskable variant.
 */
function buildSvg(markScale: number): string {
  const source = readFileSync(FAVICON_SVG_PATH, 'utf8');

  if (markScale === 1) {
    return source;
  }

  // Split the document at the end of the background <rect .../> so we can
  // wrap only the artwork that follows it in a centring transform.
  const rectCloseIndex = source.indexOf('/>');
  if (rectCloseIndex === -1) {
    throw new Error('favicon.svg: could not locate background rect to split on');
  }
  const splitAt = rectCloseIndex + 2;
  const head = source.slice(0, splitAt);
  const rest = source.slice(splitAt);

  const svgCloseIndex = rest.lastIndexOf('</svg>');
  if (svgCloseIndex === -1) {
    throw new Error('favicon.svg: missing closing </svg> tag');
  }
  const artwork = rest.slice(0, svgCloseIndex);
  const tail = rest.slice(svgCloseIndex);

  // Scale about the canvas centre: translate by half the shrunk-away
  // distance so the mark stays centred rather than sliding toward origin.
  const translate = (VIEWBOX * (1 - markScale)) / 2;

  return `${head}<g transform="translate(${translate} ${translate}) scale(${markScale})">${artwork}</g>${tail}`;
}

async function renderIcon(spec: IconSpec): Promise<{ name: string; bytes: number }> {
  const svg = buildSvg(spec.markScale);
  const outPath = join(ICONS_DIR, spec.name);

  await sharp(Buffer.from(svg), { density: 384 })
    .resize(spec.size, spec.size)
    // Flatten onto the ground colour so every PNG is fully opaque — no
    // alpha channel should leak through regardless of viewer/OS.
    .flatten({ background: GROUND })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(outPath);

  const { size: bytes } = statSync(outPath);
  if (bytes === 0) {
    throw new Error(`${spec.name}: output file is 0 bytes`);
  }
  return { name: spec.name, bytes };
}

async function main(): Promise<void> {
  mkdirSync(ICONS_DIR, { recursive: true });

  const results: Array<{ name: string; bytes: number }> = [];
  for (const spec of ICON_SPECS) {
    results.push(await renderIcon(spec));
  }

  const nameWidth = Math.max(...results.map((r) => r.name.length));
  console.log('Generated icons:');
  console.log('-'.repeat(nameWidth + 14));
  for (const { name, bytes } of results) {
    console.log(`${name.padEnd(nameWidth)}  ${String(bytes).padStart(8)} bytes`);
  }
}

main().catch((error: unknown) => {
  console.error('generate-icons failed:', error);
  process.exitCode = 1;
});
