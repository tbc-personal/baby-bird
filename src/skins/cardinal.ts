import type { Skin } from './types';

/**
 * Cardinal — Northern Cardinal (ADR-007).
 *
 * The five light colours named in the ADR table (ground, ink, accent,
 * secondary, highlight) are used exactly as given. Everything else, and the
 * whole dark set, is derived here.
 *
 * Contrast measured with `npm run check-contrast` (WCAG 2.1, two decimals).
 * `tests/unit/skins.test.ts` asserts the same thresholds, so these cannot rot:
 *   light  ink/paper 18.20  ink2/paper 7.15  ink2/ground 6.61  ink2/secondarySoft 5.88  ink2/note 6.59  ink2/egg 5.79  ink/note 16.75  ink/egg 14.73  secondary/paper 5.54  secondary/secondarySoft 4.55  onAccent/accent 5.84  focus/paper 5.84
 *   dark   ink/paper 14.76  ink2/paper 6.74  ink2/ground 7.36  ink2/secondarySoft 5.74  ink2/note 5.99  ink2/egg 5.78  ink/note 13.13  ink/egg 12.66  secondary/paper 7.07  secondary/secondarySoft 6.01  onAccent/accent 4.93  focus/paper 5.29
 *
 * Nudged from the authored value to clear the threshold:
 *   light --secondary: #8A6E4B to #7E6444
 *   dark --onAccent: #FFFFFF to #222121
 */
export const cardinal: Skin = {
  id: 'cardinal',
  label: 'Cardinal',
  bird: 'Northern Cardinal',
  light: {
    ground: '#FAF5F2',
    paper: '#FFFFFF',
    ink: '#1A1414',
    ink2: '#5E5654',
    line: '#E2DBD6',
    accent: '#C41E3A',
    accentSoft: '#F8E0E4',
    secondary: '#7E6444',
    secondarySoft: '#EFE8DE',
    highlight: '#F5D6D0',
    egg: '#F7E3DE',
    note: '#FDF4EC',
    focus: '#C41E3A',
    onAccent: '#FFFFFF',
  },
  dark: {
    ground: '#16100F',
    paper: '#211918',
    ink: '#F2ECEA',
    ink2: '#A9A09D',
    line: '#3D3331',
    accent: '#E4657A',
    accentSoft: '#38201F',
    secondary: '#C0A176',
    secondarySoft: '#302719',
    highlight: '#F5D6D0',
    egg: '#2E2624',
    note: '#2C2320',
    focus: '#E4657A',
    onAccent: '#222121',
  },
  fonts: {
    display: 'Instrument Serif',
    body: 'Instrument Sans',
    displayStack: "georgia, 'Times New Roman', serif",
    bodyStack: 'system-ui, -apple-system, sans-serif',
  },
};
