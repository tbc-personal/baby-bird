import type { Skin } from './types';

/**
 * Puffin — Atlantic Puffin (ADR-007).
 *
 * The five light colours named in the ADR table (ground, ink, accent,
 * secondary, highlight) are used exactly as given. Everything else, and the
 * whole dark set, is derived here.
 *
 * Contrast measured with `npm run check-contrast` (WCAG 2.1, two decimals).
 * `tests/unit/skins.test.ts` asserts the same thresholds, so these cannot rot:
 *   light  ink/paper 14.61  ink2/paper 5.69  ink2/ground 5.18  ink2/secondarySoft 4.90  ink2/note 5.33  ink2/egg 4.51  ink/note 13.68  ink/egg 11.57  secondary/paper 5.77  secondary/secondarySoft 4.97  onAccent/accent 6.04  focus/paper 5.77
 *   dark   ink/paper 13.34  ink2/paper 6.91  ink2/ground 7.97  ink2/secondarySoft 5.45  ink2/note 6.48  ink2/egg 5.84  ink/note 12.51  ink/egg 11.29  secondary/paper 6.36  secondary/secondarySoft 5.01  onAccent/accent 5.76  focus/paper 6.36
 *
 * Nudged from the authored value to clear the threshold:
 *   light --ink2: #5D6B70 to #5B696E
 *   light --onAccent: #FFFFFF to #040607
 *   dark --onAccent: #FFFFFF to #212221
 */
export const puffin: Skin = {
  id: 'puffin',
  label: 'Puffin',
  bird: 'Atlantic Puffin',
  light: {
    ground: '#F6F4EF',
    paper: '#FFFFFF',
    ink: '#1F2A33',
    ink2: '#5B696E',
    line: '#DCD8CF',
    accent: '#E8632B',
    accentSoft: '#FBE3D8',
    secondary: '#2F6F73',
    secondarySoft: '#E6F0F0',
    highlight: '#F2B33D',
    egg: '#EDE4D2',
    note: '#FFF7E3',
    focus: '#2F6F73',
    onAccent: '#040607',
  },
  dark: {
    ground: '#15191D',
    paper: '#1F262B',
    ink: '#EEF0EA',
    ink2: '#A5B0B4',
    line: '#37424A',
    accent: '#F07A45',
    accentSoft: '#3A2A22',
    secondary: '#6FB2B5',
    secondarySoft: '#223A3C',
    highlight: '#F2B33D',
    egg: '#2C3238',
    note: '#2C2A22',
    focus: '#6FB2B5',
    onAccent: '#212221',
  },
  fonts: {
    display: 'Bricolage Grotesque',
    body: 'Atkinson Hyperlegible',
    displayStack: "'Arial Narrow', system-ui, sans-serif",
    bodyStack: "'Helvetica Neue', arial, sans-serif",
  },
};
