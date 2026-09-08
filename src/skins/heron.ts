import type { Skin } from './types';

/**
 * Green Heron — Green Heron (ADR-007).
 *
 * The five light colors named in the ADR table (ground, ink, accent,
 * secondary, highlight) are used exactly as given. Everything else, and the
 * whole dark set, is derived here.
 *
 * Contrast measured with `npm run check-contrast` (WCAG 2.1, two decimals).
 * `tests/unit/skins.test.ts` asserts the same thresholds, so these cannot rot:
 *   light  ink/paper 14.90  ink2/paper 6.53  ink2/ground 5.85  ink2/secondarySoft 5.38  ink2/note 5.95  ink2/egg 5.31  ink/note 13.58  ink/egg 12.11  secondary/paper 9.72  secondary/secondarySoft 8.00  onAccent/accent 7.38  focus/paper 9.72
 *   dark   ink/paper 13.98  ink2/paper 6.60  ink2/ground 7.47  ink2/secondarySoft 5.84  ink2/note 6.07  ink2/egg 5.61  ink/note 12.86  ink/egg 11.88  secondary/paper 6.23  secondary/secondarySoft 5.51  onAccent/accent 5.42  focus/paper 6.23
 *
 * Nudged from the authored value to clear the threshold:
 *   dark --onAccent: #FFFFFF to #212120
 */
export const heron: Skin = {
  id: 'heron',
  label: 'Green Heron',
  bird: 'Green Heron',
  light: {
    ground: '#F2F3EE',
    paper: '#FFFFFF',
    ink: '#1E2A22',
    ink2: '#56605A',
    line: '#D7DAD2',
    accent: '#7A4A2E',
    accentSoft: '#F0E6DF',
    secondary: '#2F4A3A',
    secondarySoft: '#E3EBE6',
    highlight: '#D9A21B',
    egg: '#F3E7C8',
    note: '#FBF4E2',
    focus: '#2F4A3A',
    onAccent: '#FFFFFF',
  },
  dark: {
    ground: '#101410',
    paper: '#1A211B',
    ink: '#E9EEE8',
    ink2: '#9CA79E',
    line: '#333D36',
    accent: '#C08A66',
    accentSoft: '#2C231C',
    secondary: '#7FA98C',
    secondarySoft: '#1F2C24',
    highlight: '#E0AE33',
    egg: '#262E28',
    note: '#2A2618',
    focus: '#7FA98C',
    onAccent: '#212120',
  },
  fonts: {
    display: 'Cormorant Garamond',
    body: 'Source Sans 3',
    displayStack: 'garamond, georgia, serif',
    bodyStack: 'system-ui, -apple-system, sans-serif',
  },
};
