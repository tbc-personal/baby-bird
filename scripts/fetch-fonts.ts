/**
 * Self-hosts the app's fonts (ADR-007 skins) instead of loading them from
 * Google Fonts at runtime.
 *
 * How it works:
 *   1. For each family below we hit Google's `css2` endpoint with the exact
 *      query syntax used in `docs/mockups/screens.html` (variable-font
 *      families use the `opsz,wght@12..96,500` form; static families use
 *      plain `wght@400;600`).
 *   2. Google's css2 endpoint returns different formats depending on the
 *      requesting User-Agent: old/unknown UAs get woff/ttf, but a modern
 *      desktop Chrome UA gets woff2 (Chrome has supported woff2 for years,
 *      so Google assumes it and skips the older formats). We spoof a
 *      current desktop Chrome UA string to force woff2-only output.
 *   3. The returned CSS has one `@font-face` block per unicode-range subset
 *      (latin, latin-ext, cyrillic, greek, vietnamese, ...). We only want
 *      the block Google comments `/* latin *\/` above (or, equivalently,
 *      the U+0000-00FF,... latin unicode-range) — every other subset is
 *      discarded so we don't ship glyphs the app never renders.
 *   4. Each kept block's `url(...)` points at a `fonts.gstatic.com` woff2;
 *      we download it into `public/fonts/` under a deterministic
 *      `<kebab-family>-<weight-or-variable>.woff2` name.
 *   5. We rewrite the kept @font-face rules (same font-family, font-style,
 *      font-weight, unicode-range) to point at the local file, add
 *      `font-display: swap`, and write them to both `src/styles/fonts.css`
 *      (referenced by the app as `/fonts/<file>.woff2`, i.e. Vite's public
 *      base). Vite rewrites the leading slash to include `base` at build time,
 *      which was confirmed with VITE_BASE=/nestling/, so a project Pages URL
 *      resolves the fonts correctly with no extra handling.
 *
 * Idempotent: an existing woff2 file is left alone unless `--force` is
 * passed. Exits non-zero if any request/download fails or a family's CSS
 * has no latin block.
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = resolve(repoRoot, 'public/fonts');
const force = process.argv.includes('--force');

mkdirSync(fontsDir, { recursive: true });

// A modern desktop Chrome UA — this is what makes Google's css2 endpoint
// respond with woff2 @font-face rules instead of ttf/woff.
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

interface FamilySpec {
  /** Google Fonts family name with "+" for spaces, e.g. "Bricolage+Grotesque" */
  readonly urlName: string;
  /** Human family name as Google reports it in font-family, e.g. "Bricolage Grotesque" */
  readonly name: string;
  /** kebab-case slug used in filenames, e.g. "bricolage-grotesque" */
  readonly slug: string;
  /**
   * true if this is a variable-font request using the "opsz,wght@12..96,W"
   * axis syntax from docs/mockups/screens.html — one request, one shared
   * file, multiple font-weight declarations over it.
   */
  readonly variable: boolean;
  /**
   * Weights to fetch. For `variable: true` families this is still the full
   * list of declared weights (500, 700, 800, ...) but they are all folded
   * into a single combined request using the opsz,wght axis syntax, since
   * that's what actually produces the variable file. For static families
   * each weight is requested *separately* — see the comment below on why
   * combining "wght@400;600" in one request is unsafe.
   */
  readonly weights: readonly number[];
}

// Family/weight list per the task table, using the exact query syntax from
// docs/mockups/screens.html line 2 (family names, "+" separators, opsz axis
// for the one variable family in this set).
//
// IMPORTANT: for *static* families we deliberately fetch each weight with
// its own request (e.g. "Public+Sans:wght@400" and "Public+Sans:wght@600"
// separately) rather than combining them as "Public+Sans:wght@400;600" in
// one request. Testing showed Google's css2 endpoint sometimes collapses a
// combined multi-weight request onto a *single* underlying woff2 file
// shared by every requested weight (confirmed for Public Sans, Outfit,
// Nunito Sans, Cormorant Garamond, Source Sans 3, Karla, Gabarito,
// Instrument Sans, and Mulish) — i.e. font-weight: 400 and font-weight: 600
// would render pixel-identical. Requesting one weight per call reliably
// returns the distinct static instance for that weight.
const FAMILIES: readonly FamilySpec[] = [
  {
    urlName: 'Bricolage+Grotesque',
    name: 'Bricolage Grotesque',
    slug: 'bricolage-grotesque',
    variable: true,
    weights: [500, 700, 800],
  },
  {
    urlName: 'Atkinson+Hyperlegible',
    name: 'Atkinson Hyperlegible',
    slug: 'atkinson-hyperlegible',
    variable: false,
    weights: [400, 700],
  },
  {
    urlName: 'IBM+Plex+Mono',
    name: 'IBM Plex Mono',
    slug: 'ibm-plex-mono',
    variable: false,
    weights: [400, 500],
  },
  {
    urlName: 'DM+Serif+Display',
    name: 'DM Serif Display',
    slug: 'dm-serif-display',
    variable: false,
    weights: [400],
  },
  {
    urlName: 'Public+Sans',
    name: 'Public Sans',
    slug: 'public-sans',
    variable: false,
    weights: [400, 600],
  },
  {
    urlName: 'Outfit',
    name: 'Outfit',
    slug: 'outfit',
    variable: false,
    weights: [500, 700],
  },
  {
    urlName: 'Nunito+Sans',
    name: 'Nunito Sans',
    slug: 'nunito-sans',
    variable: false,
    weights: [400, 700],
  },
  {
    urlName: 'Cormorant+Garamond',
    name: 'Cormorant Garamond',
    slug: 'cormorant-garamond',
    variable: false,
    weights: [600, 700],
  },
  {
    urlName: 'Source+Sans+3',
    name: 'Source Sans 3',
    slug: 'source-sans-3',
    variable: false,
    weights: [400, 600],
  },
  { urlName: 'Archivo', name: 'Archivo', slug: 'archivo', variable: false, weights: [800] },
  { urlName: 'Karla', name: 'Karla', slug: 'karla', variable: false, weights: [400, 600] },
  {
    urlName: 'Gabarito',
    name: 'Gabarito',
    slug: 'gabarito',
    variable: false,
    weights: [600, 800],
  },
  {
    urlName: 'Instrument+Serif',
    name: 'Instrument Serif',
    slug: 'instrument-serif',
    variable: false,
    weights: [400],
  },
  {
    urlName: 'Instrument+Sans',
    name: 'Instrument Sans',
    slug: 'instrument-sans',
    variable: false,
    weights: [400, 600],
  },
  {
    urlName: 'Mulish',
    name: 'Mulish',
    slug: 'mulish',
    variable: false,
    weights: [400, 700],
  },
];

interface ParsedFace {
  readonly fontFamily: string;
  readonly fontStyle: string;
  readonly fontWeight: string;
  readonly unicodeRange: string;
  readonly sourceUrl: string;
}

/** Splits Google's css2 response into individual @font-face blocks. */
function splitFontFaceBlocks(css: string): string[] {
  const blocks: string[] = [];
  const re = /\/\*[^*]*\*\/\s*@font-face\s*\{[^}]*\}/g;
  const matches = css.match(re);
  if (matches) {
    blocks.push(...matches);
  } else {
    // Fallback: no comments present, split on bare @font-face blocks.
    const bare = css.match(/@font-face\s*\{[^}]*\}/g);
    if (bare) blocks.push(...bare);
  }
  return blocks;
}

/** Extracts the fields we need from one @font-face block, or null if it isn't the latin subset. */
function parseLatinFace(block: string): ParsedFace | null {
  const isLatin =
    /\/\*\s*latin\s*\*\//.test(block) ||
    /unicode-range:\s*U\+0000-00FF,U\+0131,U\+0152-0153/.test(block);
  if (!isLatin) return null;

  const familyMatch = /font-family:\s*['"]([^'"]+)['"]/.exec(block);
  const styleMatch = /font-style:\s*([a-zA-Z]+)/.exec(block);
  const weightMatch = /font-weight:\s*([0-9 ]+)/.exec(block);
  const rangeMatch = /unicode-range:\s*([^;]+);/.exec(block);
  const urlMatch = /src:\s*url\(([^)]+)\)\s*format\(['"]woff2['"]\)/.exec(block);

  const fontFamily = familyMatch?.[1];
  const fontStyle = styleMatch?.[1];
  const fontWeightRaw = weightMatch?.[1];
  const unicodeRange = rangeMatch?.[1];
  const sourceUrl = urlMatch?.[1];

  if (!fontFamily || !fontStyle || !fontWeightRaw || !unicodeRange || !sourceUrl) {
    return null;
  }

  return {
    fontFamily,
    fontStyle,
    fontWeight: fontWeightRaw.trim(),
    unicodeRange: unicodeRange.trim(),
    sourceUrl: sourceUrl.trim(),
  };
}

/** Builds the css2 family query segment for one request. */
function buildQuery(spec: FamilySpec): string {
  if (spec.variable) {
    // Variable font: one request spanning every weight via the opsz,wght
    // axis syntax, e.g. "opsz,wght@12..96,500;12..96,700;12..96,800".
    const axisParts = spec.weights.map((w) => `12..96,${w}`).join(';');
    return `${spec.urlName}:opsz,wght@${axisParts}`;
  }
  return spec.urlName;
}

async function fetchCss(query: string): Promise<string> {
  const url = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
  const res = await fetch(url, { headers: { 'User-Agent': CHROME_UA } });
  if (!res.ok) {
    throw new Error(`css2 request for ${query} failed: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function downloadWoff2(url: string, destPath: string): Promise<number> {
  const res = await fetch(url, { headers: { 'User-Agent': CHROME_UA } });
  if (!res.ok) {
    throw new Error(`download failed: ${res.status} ${res.statusText} (${url})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const magic = buf.subarray(0, 4).toString('ascii');
  if (magic !== 'wOF2') {
    throw new Error(`downloaded file is not woff2 (magic="${magic}"): ${url}`);
  }
  writeFileSync(destPath, buf);
  return buf.length;
}

interface SummaryRow {
  readonly family: string;
  readonly weight: string;
  readonly file: string;
  readonly bytes: number;
}

const summary: SummaryRow[] = [];
const cssRules: string[] = [];
let hadFailure = false;

for (const spec of FAMILIES) {
  console.log(`\n== ${spec.name} ==`);

  // Variable families: one combined request covering every weight, backed
  // by a single physical file. Static families: one request per weight, to
  // avoid Google's css2 endpoint silently collapsing distinct weights onto
  // the same underlying static instance (see comment on FAMILIES above).
  const queries = spec.variable
    ? [buildQuery(spec)]
    : spec.weights.map((w) => `${spec.urlName}:wght@${w}`);

  const latinFaces: ParsedFace[] = [];
  let familyFailed = false;
  for (const query of queries) {
    let css: string;
    try {
      css = await fetchCss(query);
    } catch (err) {
      console.error(`FAIL ${spec.name}: ${(err as Error).message}`);
      hadFailure = true;
      familyFailed = true;
      continue;
    }
    const blocks = splitFontFaceBlocks(css);
    const faces = blocks.map(parseLatinFace).filter((f): f is ParsedFace => f !== null);
    if (faces.length === 0) {
      console.error(`FAIL ${spec.name} (${query}): no latin @font-face block found`);
      hadFailure = true;
      familyFailed = true;
      continue;
    }
    latinFaces.push(...faces);
  }

  if (latinFaces.length === 0) {
    if (!familyFailed) {
      console.error(`FAIL ${spec.name}: no latin @font-face block found`);
      hadFailure = true;
    }
    continue;
  }

  // Weights present in this family's response, e.g. ["500","700","800"].
  const weightsSeen = new Set(latinFaces.map((f) => f.fontWeight));
  const isSharedFile = spec.variable && weightsSeen.size > 1;

  for (const face of latinFaces) {
    const weightSlug = face.fontWeight.replace(/\s+/g, '-');
    const fileSlug = isSharedFile ? `${spec.slug}-variable` : `${spec.slug}-${weightSlug}`;
    const fileName = `${fileSlug}.woff2`;
    const destPath = resolve(fontsDir, fileName);

    let bytes: number;
    if (existsSync(destPath) && !force) {
      bytes = readFileSync(destPath).length;
      console.log(`skip  ${fileName} (exists, ${bytes} bytes)`);
    } else {
      try {
        bytes = await downloadWoff2(face.sourceUrl, destPath);
        console.log(`ok    ${fileName} (${bytes} bytes)`);
      } catch (err) {
        console.error(`FAIL  ${fileName}: ${(err as Error).message}`);
        hadFailure = true;
        continue;
      }
    }

    summary.push({
      family: face.fontFamily,
      weight: face.fontWeight,
      file: fileName,
      bytes,
    });
    cssRules.push(
      [
        '@font-face {',
        `  font-family: '${face.fontFamily}';`,
        `  font-style: ${face.fontStyle};`,
        `  font-weight: ${face.fontWeight.replace(' ', ' ')};`,
        '  font-display: swap;',
        `  src: url('/fonts/${fileName}') format('woff2');`,
        `  unicode-range: ${face.unicodeRange};`,
        '}',
      ].join('\n'),
    );
  }
}

if (hadFailure) {
  console.error('\nfetch-fonts: one or more families failed, see FAIL lines above');
  process.exit(1);
}

const generatedCss = cssRules.join('\n\n') + '\n';

const srcHeader =
  '/*\n' +
  ' * Self-hosted @font-face declarations, generated by scripts/fetch-fonts.ts.\n' +
  ' * Do not edit by hand — re-run `npm run fonts` (optionally with --force)\n' +
  ' * to regenerate. The woff2 files live in public/fonts/.\n' +
  ' */\n\n';

writeFileSync(resolve(repoRoot, 'src/styles/fonts.css'), srcHeader + generatedCss);

console.log(`\n${'family'.padEnd(24)}${'weight'.padEnd(10)}${'file'.padEnd(34)}bytes`);
for (const row of summary) {
  console.log(
    `${row.family.padEnd(24)}${row.weight.padEnd(10)}${row.file.padEnd(34)}${row.bytes}`,
  );
}
console.log(`\n${summary.length} font file(s) across ${FAMILIES.length} families`);
