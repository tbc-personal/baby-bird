/**
 * Skin registry and `applySkin()` (ADR-007).
 *
 * A skin is data. Applying one writes the token custom properties onto `:root`
 * for light and dark, sets `data-skin`, and points the two font variables at
 * the skin's families. Components never read a skin object; they use only the
 * token names, which the stylelint rule in .stylelintrc.json enforces.
 */
import { DEFAULT_SKIN, SKIN_IDS, type SkinId } from './ids';
import { TOKEN_PROPERTY, type Skin, type Tokens } from './types';
import { puffin } from './puffin';
import { kingfisher } from './kingfisher';
import { bluebird } from './bluebird';
import { heron } from './heron';
import { oriole } from './oriole';
import { goldfinch } from './goldfinch';
import { cardinal } from './cardinal';

export const SKINS: Readonly<Record<SkinId, Skin>> = {
  puffin,
  kingfisher,
  bluebird,
  heron,
  oriole,
  goldfinch,
  cardinal,
};

export const SKIN_LIST: readonly Skin[] = SKIN_IDS.map((id) => SKINS[id]);

export function getSkin(id: SkinId): Skin {
  return SKINS[id] ?? SKINS[DEFAULT_SKIN];
}

/**
 * `applySkin` owns one <style> element. A single stylesheet holding a `:root`
 * block plus a `prefers-color-scheme` block is used rather than inline styles,
 * because the dark variant cannot be expressed inline.
 */
const STYLE_ELEMENT_ID = 'nestling-skin';

function tokenBlock(tokens: Tokens, indent: string): string {
  return (Object.keys(TOKEN_PROPERTY) as (keyof Tokens)[])
    .map((key) => `${indent}${TOKEN_PROPERTY[key]}: ${tokens[key]};`)
    .join('\n');
}

function fontBlock(skin: Skin, indent: string): string {
  return [
    `${indent}--font-display: '${skin.fonts.display}', ${skin.fonts.displayStack};`,
    `${indent}--font-body: '${skin.fonts.body}', ${skin.fonts.bodyStack};`,
  ].join('\n');
}

export function skinCss(skin: Skin): string {
  return [
    ':root {',
    tokenBlock(skin.light, '  '),
    fontBlock(skin, '  '),
    '}',
    '@media (prefers-color-scheme: dark) {',
    "  :root:not([data-theme='light']) {",
    tokenBlock(skin.dark, '    '),
    '  }',
    '}',
    ":root[data-theme='dark'] {",
    tokenBlock(skin.dark, '  '),
    '}',
  ].join('\n');
}

export function applySkin(id: SkinId, doc: Document = document): void {
  const skin = getSkin(id);
  const existing = doc.getElementById(STYLE_ELEMENT_ID);
  const style =
    existing instanceof HTMLStyleElement ? existing : doc.createElement('style');
  if (style !== existing) {
    style.id = STYLE_ELEMENT_ID;
    doc.head.appendChild(style);
  }
  style.textContent = skinCss(skin);
  doc.documentElement.setAttribute('data-skin', skin.id);
}

export { DEFAULT_SKIN, SKIN_IDS };
export type { Skin, SkinId, Tokens };
