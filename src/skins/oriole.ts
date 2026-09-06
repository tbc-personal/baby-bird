import type { Skin } from './types';

/**
 * Oriole — Baltimore Oriole (ADR-007).
 *
 * The five light colors named in the ADR table (ground, ink, accent,
 * secondary, highlight) are used exactly as given. Everything else, and the
 * whole dark set, is derived here.
 *
 * Contrast measured with `npm run check-contrast` (WCAG 2.1, two decimals).
 * `tests/unit/skins.test.ts` asserts the same thresholds, so these cannot rot:
 *   light  ink/paper 18.42  ink2/paper 6.69  ink2/ground 6.27  ink2/secondarySoft 5.51  ink2/note 6.24  ink2/egg 5.73  ink/note 17.20  ink/egg 15.78  secondary/paper 11.37  secondary/secondarySoft 9.37  onAccent/accent 8.39  focus/paper 11.37
 *   dark   ink/paper 15.10  ink2/paper 7.00  ink2/ground 7.69  ink2/secondarySoft 5.68  ink2/note 6.18  ink2/egg 6.05  ink/note 13.32  ink/egg 13.06  secondary/paper 8.99  secondary/secondarySoft 7.29  onAccent/accent 7.57  focus/paper 8.16
 *
 * Nudged from the authored value to clear the threshold:
 *   light --onAccent: #FFFFFF to #030303
 *   dark --onAccent: #FFFFFF to #222221
 */
export const oriole: Skin = {
  id: 'oriole',
  label: 'Oriole',
  bird: 'Baltimore Oriole',
  light: {
    ground: '#FBF7F1',
    paper: '#FFFFFF',
    ink: '#141414',
    ink2: '#5C5C5C',
    line: '#E0DBD4',
    accent: '#F28C1A',
    accentSoft: '#FDEBD4',
    secondary: '#3A3A3A',
    secondarySoft: '#E9E9E9',
    highlight: '#FFD9A8',
    egg: '#FCEBD5',
    note: '#FFF6E9',
    focus: '#3A3A3A',
    onAccent: '#030303',
  },
  dark: {
    ground: '#121110',
    paper: '#1D1B19',
    ink: '#F2F0ED',
    ink2: '#A8A5A1',
    line: '#38352F',
    accent: '#F5A03D',
    accentSoft: '#38291A',
    secondary: '#BFBBB5',
    secondarySoft: '#2E2C29',
    highlight: '#FFD9A8',
    egg: '#2A2724',
    note: '#2C2519',
    focus: '#F5A03D',
    onAccent: '#222221',
  },
  fonts: {
    display: 'Archivo',
    body: 'Karla',
    displayStack: "'Helvetica Neue', arial, sans-serif",
    bodyStack: 'system-ui, -apple-system, sans-serif',
  },
};
