import type { Skin } from './types';

/**
 * Goldfinch — American Goldfinch (ADR-007).
 *
 * The five light colors named in the ADR table (ground, ink, accent,
 * secondary, highlight) are used exactly as given. Everything else, and the
 * whole dark set, is derived here.
 * The Goldfinch accent is the ADR's darkened yellow (#C9A000), not true
 * goldfinch yellow; --highlight carries the brighter tone.
 *
 * Contrast measured with `npm run check-contrast` (WCAG 2.1, two decimals).
 * `tests/unit/skins.test.ts` asserts the same thresholds, so these cannot rot:
 *   light  ink/paper 17.40  ink2/paper 6.62  ink2/ground 6.38  ink2/secondarySoft 5.45  ink2/note 6.30  ink2/egg 5.90  ink/note 16.57  ink/egg 15.51  secondary/paper 5.54  secondary/secondarySoft 4.56  onAccent/accent 8.31  focus/paper 5.30
 *   dark   ink/paper 14.48  ink2/paper 6.76  ink2/ground 7.54  ink2/secondarySoft 5.73  ink2/note 5.90  ink2/egg 5.82  ink/note 12.65  ink/egg 12.47  secondary/paper 6.94  secondary/secondarySoft 5.88  onAccent/accent 8.03  focus/paper 8.35
 *
 * Nudged from the authored value to clear the threshold:
 *   light --secondary: #6B6F3A to #686C38
 *   light --onAccent: #FFFFFF to #040404
 *   dark --onAccent: #FFFFFF to #222220
 */
export const goldfinch: Skin = {
  id: 'goldfinch',
  label: 'Goldfinch',
  bird: 'American Goldfinch',
  light: {
    ground: '#FCFBF4',
    paper: '#FFFFFF',
    ink: '#1A1A1A',
    ink2: '#5D5D58',
    line: '#E2E0D5',
    accent: '#C9A000',
    accentSoft: '#F7EEC9',
    secondary: '#686C38',
    secondarySoft: '#E9EADD',
    highlight: '#FBEC8C',
    egg: '#FAF3C8',
    note: '#FEFAE3',
    focus: '#6B6F3A',
    onAccent: '#040404',
  },
  dark: {
    ground: '#14140F',
    paper: '#1F1F18',
    ink: '#F1F0E7',
    ink2: '#A7A69B',
    line: '#3A3930',
    accent: '#D9B520',
    accentSoft: '#332C10',
    secondary: '#A8AC6F',
    secondarySoft: '#2B2D1E',
    highlight: '#FBEC8C',
    egg: '#2B2B23',
    note: '#2C2A18',
    focus: '#D9B520',
    onAccent: '#222220',
  },
  fonts: {
    display: 'Gabarito',
    body: 'Mulish',
    displayStack: "'Trebuchet MS', system-ui, sans-serif",
    bodyStack: 'system-ui, -apple-system, sans-serif',
  },
};
