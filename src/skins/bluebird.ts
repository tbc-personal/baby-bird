import type { Skin } from './types';

/**
 * Bluebird — Eastern Bluebird (ADR-007).
 *
 * The five light colours named in the ADR table (ground, ink, accent,
 * secondary, highlight) are used exactly as given. Everything else, and the
 * whole dark set, is derived here.
 *
 * Contrast measured with `npm run check-contrast` (WCAG 2.1, two decimals).
 * `tests/unit/skins.test.ts` asserts the same thresholds, so these cannot rot:
 *   light  ink/paper 12.91  ink2/paper 5.85  ink2/ground 5.37  ink2/secondarySoft 4.86  ink2/note 5.30  ink2/egg 4.83  ink/note 11.71  ink/egg 10.66  secondary/paper 5.41  secondary/secondarySoft 4.50  onAccent/accent 4.91  focus/paper 4.11
 *   dark   ink/paper 13.83  ink2/paper 6.71  ink2/ground 7.62  ink2/secondarySoft 5.87  ink2/note 6.18  ink2/egg 5.66  ink/note 12.74  ink/egg 11.67  secondary/paper 5.87  secondary/secondarySoft 5.13  onAccent/accent 5.99  focus/paper 5.94
 *
 * Nudged from the authored value to clear the threshold:
 *   light --secondary: #C7643A to #A55330
 *   light --onAccent: #FFFFFF to #05070A
 *   dark --onAccent: #FFFFFF to #212122
 */
export const bluebird: Skin = {
  id: 'bluebird',
  label: 'Bluebird',
  bird: 'Eastern Bluebird',
  light: {
    ground: '#F7F5F0',
    paper: '#FFFFFF',
    ink: '#23324A',
    ink2: '#5A6675',
    line: '#DEDAD2',
    accent: '#3B7DD8',
    accentSoft: '#E3EDFA',
    secondary: '#A55330',
    secondarySoft: '#F7E7DF',
    highlight: '#D6E6F7',
    egg: '#EDE9E0',
    note: '#FBF3E4',
    focus: '#3B7DD8',
    onAccent: '#05070A',
  },
  dark: {
    ground: '#12161E',
    paper: '#1C222D',
    ink: '#ECEFF3',
    ink2: '#A0A9B5',
    line: '#353D4A',
    accent: '#6BA0E8',
    accentSoft: '#1F2C3E',
    secondary: '#E08659',
    secondarySoft: '#3A2820',
    highlight: '#D6E6F7',
    egg: '#292F39',
    note: '#2B2822',
    focus: '#6BA0E8',
    onAccent: '#212122',
  },
  fonts: {
    display: 'Outfit',
    body: 'Nunito Sans',
    displayStack: "'Avenir Next', system-ui, sans-serif",
    bodyStack: "'Segoe UI', system-ui, sans-serif",
  },
};
