import { describe, expect, it } from 'vitest';
import { applySkin, getSkin, skinCss, SKIN_LIST, SKINS } from '../../src/skins';
import { SKIN_IDS, DEFAULT_SKIN } from '../../src/skins/ids';
import { TOKEN_PROPERTY, type Tokens } from '../../src/skins/types';
import { contrast, parseHex } from '../../src/lib/contrast';

const AA = 4.5;
const AA_LARGE = 3;

/**
 * Every pair of tokens that ends up as text on a background somewhere in the
 * app. The build prompt requires 4.5:1 for text in both themes; the focus ring
 * is a 3px outline, so it is held to the large-text bar.
 */
const PAIRS: ReadonlyArray<readonly [string, keyof Tokens, keyof Tokens, number]> = [
  ['body text on paper', 'ink', 'paper', 7],
  ['body text on ground', 'ink', 'ground', 7],
  ['secondary text on paper', 'ink2', 'paper', AA],
  ['secondary text on ground', 'ink2', 'ground', AA],
  ['tile caption on the tile', 'ink2', 'secondarySoft', AA],
  ['note text', 'ink2', 'note', AA],
  ['text on the photo area', 'ink2', 'egg', AA],
  ['heading on a note', 'ink', 'note', AA],
  ['heading on the photo area', 'ink', 'egg', AA],
  ['links on paper', 'secondary', 'paper', AA],
  ['tile value on the tile', 'secondary', 'secondarySoft', AA],
  ['button label on the accent', 'onAccent', 'accent', AA],
  ['focus ring on paper', 'focus', 'paper', AA_LARGE],
  ['focus ring on ground', 'focus', 'ground', AA_LARGE],
];

describe('the registry', () => {
  it('holds all seven skins from ADR-007 and nothing else', () => {
    expect(SKIN_IDS).toEqual([
      'puffin',
      'kingfisher',
      'bluebird',
      'heron',
      'oriole',
      'goldfinch',
      'cardinal',
    ]);
    expect(SKIN_LIST).toHaveLength(7);
    expect(Object.keys(SKINS)).toHaveLength(7);
  });

  it('defaults to Puffin', () => {
    expect(DEFAULT_SKIN).toBe('puffin');
  });

  it('falls back to the default for an unknown id', () => {
    expect(getSkin('pelican' as never).id).toBe('puffin');
  });

  it('gives every skin an id matching its key, a label and a bird', () => {
    for (const [id, skin] of Object.entries(SKINS)) {
      expect(skin.id).toBe(id);
      expect(skin.label.length).toBeGreaterThan(0);
      expect(skin.bird.length).toBeGreaterThan(0);
    }
  });

  it('pairs the display and body faces ADR-007 names', () => {
    const expected: Record<string, [string, string]> = {
      puffin: ['Bricolage Grotesque', 'Atkinson Hyperlegible'],
      kingfisher: ['DM Serif Display', 'Public Sans'],
      bluebird: ['Outfit', 'Nunito Sans'],
      heron: ['Cormorant Garamond', 'Source Sans 3'],
      oriole: ['Archivo', 'Karla'],
      goldfinch: ['Gabarito', 'Mulish'],
      cardinal: ['Instrument Serif', 'Instrument Sans'],
    };
    for (const skin of SKIN_LIST) {
      expect([skin.fonts.display, skin.fonts.body]).toEqual(expected[skin.id]);
      expect(skin.fonts.displayStack.length).toBeGreaterThan(0);
      expect(skin.fonts.bodyStack.length).toBeGreaterThan(0);
    }
  });
});

describe('every skin defines every token in both themes', () => {
  const keys = Object.keys(TOKEN_PROPERTY) as (keyof Tokens)[];

  it.each(SKIN_LIST.map((skin) => [skin.label, skin] as const))('%s', (_label, skin) => {
    for (const mode of ['light', 'dark'] as const) {
      for (const key of keys) {
        const value = skin[mode][key];
        expect(value, `${skin.id} ${mode} ${key}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(() => parseHex(value)).not.toThrow();
      }
    }
  });
});

/**
 * What each skin's --secondary actually ships as, and why it differs from the
 * ADR table where it does. Bluebird is the substantive one: the ADR's #C7643A
 * measures 3.95:1 on white, which fails the 4.5:1 body-text bar, so it is
 * darkened. Goldfinch and Cardinal move by a hair, only to clear 4.5:1 against
 * their own --secondary-soft tile.
 */
const ALLOWED_SECONDARY: Record<string, { adr: string; used: string; why: string }> = {
  puffin: { adr: '#2F6F73', used: '#2F6F73', why: 'unchanged; 5.77:1 on white' },
  kingfisher: { adr: '#4A6B8A', used: '#4A6B8A', why: 'unchanged; 5.58:1 on white' },
  bluebird: {
    adr: '#C7643A',
    used: '#A55330',
    why: 'the ADR value is 3.95:1 on white, below the 4.5:1 bar for link text; darkened to 5.41:1',
  },
  heron: { adr: '#2F4A3A', used: '#2F4A3A', why: 'unchanged; 9.72:1 on white' },
  oriole: { adr: '#3A3A3A', used: '#3A3A3A', why: 'unchanged; 11.37:1 on white' },
  goldfinch: {
    adr: '#6B6F3A',
    used: '#686C38',
    why: 'darkened by a hair to clear 4.5:1 on its own --secondary-soft tile',
  },
  cardinal: {
    adr: '#8A6E4B',
    used: '#7E6444',
    why: 'darkened to clear 4.5:1 on its own --secondary-soft tile',
  },
};

describe('the ADR-007 table colours are used as given', () => {
  const TABLE: Record<
    string,
    Pick<Tokens, 'ground' | 'ink' | 'accent' | 'secondary' | 'highlight'>
  > = {
    puffin: {
      ground: '#F6F4EF',
      ink: '#1F2A33',
      accent: '#E8632B',
      secondary: '#2F6F73',
      highlight: '#F2B33D',
    },
    kingfisher: {
      ground: '#F3F5F7',
      ink: '#1C2E44',
      accent: '#B5542D',
      secondary: '#4A6B8A',
      highlight: '#9DB9CE',
    },
    bluebird: {
      ground: '#F7F5F0',
      ink: '#23324A',
      accent: '#3B7DD8',
      secondary: '#C7643A',
      highlight: '#D6E6F7',
    },
    heron: {
      ground: '#F2F3EE',
      ink: '#1E2A22',
      accent: '#7A4A2E',
      secondary: '#2F4A3A',
      highlight: '#D9A21B',
    },
    oriole: {
      ground: '#FBF7F1',
      ink: '#141414',
      accent: '#F28C1A',
      secondary: '#3A3A3A',
      highlight: '#FFD9A8',
    },
    goldfinch: {
      ground: '#FCFBF4',
      ink: '#1A1A1A',
      accent: '#C9A000',
      secondary: '#6B6F3A',
      highlight: '#FBEC8C',
    },
    cardinal: {
      ground: '#FAF5F2',
      ink: '#1A1414',
      accent: '#C41E3A',
      secondary: '#8A6E4B',
      highlight: '#F5D6D0',
    },
  };

  it.each(SKIN_LIST.map((skin) => [skin.label, skin] as const))('%s', (_label, skin) => {
    const row = TABLE[skin.id];
    expect(row).toBeDefined();
    // ground, ink, accent and highlight are used verbatim.
    expect(skin.light.ground.toUpperCase()).toBe(row?.ground);
    expect(skin.light.ink.toUpperCase()).toBe(row?.ink);
    expect(skin.light.accent.toUpperCase()).toBe(row?.accent);
    expect(skin.light.highlight.toUpperCase()).toBe(row?.highlight);
    /*
     * `secondary` is the one colour that can move, because it is link text and
     * the value on the tile, so it has to clear 4.5:1 against paper and against
     * --secondary-soft. Three skins needed a nudge. Each is named here with the
     * measured reason, so a silent drift in a fourth skin fails this test.
     */
    const allowed = ALLOWED_SECONDARY[skin.id];
    expect(
      allowed,
      `${skin.id} has no recorded allowance for a secondary shift`,
    ).toBeDefined();
    expect(skin.light.secondary.toUpperCase()).toBe(allowed?.used);
  });
});

describe('contrast holds in both themes for every skin', () => {
  const cases = SKIN_LIST.flatMap((skin) =>
    (['light', 'dark'] as const).flatMap((mode) =>
      PAIRS.map(([label, a, b, target]) => ({
        name: `${skin.label} ${mode}: ${label}`,
        tokens: skin[mode],
        a,
        b,
        target,
      })),
    ),
  );

  it.each(cases)('$name', ({ tokens, a, b, target }) => {
    expect(contrast(tokens[a], tokens[b])).toBeGreaterThanOrEqual(target);
  });
});

describe('dark is actually darker than light', () => {
  it.each(SKIN_LIST.map((skin) => [skin.label, skin] as const))('%s', (_label, skin) => {
    const lum = (hex: string) => {
      const [r, g, b] = parseHex(hex);
      return (r + g + b) / 3;
    };
    expect(lum(skin.dark.ground)).toBeLessThan(lum(skin.light.ground));
    expect(lum(skin.dark.paper)).toBeLessThan(lum(skin.light.paper));
    expect(lum(skin.dark.ink)).toBeGreaterThan(lum(skin.light.ink));
  });
});

describe('applySkin', () => {
  it('writes light tokens, a dark media block and a data-theme block', () => {
    const css = skinCss(SKINS.cardinal);
    expect(css).toContain('--ground: #FAF5F2;');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain(":root:not([data-theme='light'])");
    expect(css).toContain(":root[data-theme='dark']");
    expect(css).toContain("--font-display: 'Instrument Serif'");
    expect(css).toContain("--font-body: 'Instrument Sans'");
    // Every token appears in each of the three blocks.
    for (const property of Object.values(TOKEN_PROPERTY)) {
      expect(css.split(`${property}:`).length - 1).toBe(3);
    }
  });

  it('owns exactly one style element and swaps its contents', () => {
    applySkin('puffin');
    applySkin('oriole');
    applySkin('heron');
    const styles = document.head.querySelectorAll('style#nestling-skin');
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toContain('--ground: #F2F3EE;');
    expect(document.documentElement.getAttribute('data-skin')).toBe('heron');
  });
});
