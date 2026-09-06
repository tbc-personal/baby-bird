import type { Skin } from './types';

/**
 * Kingfisher — Belted Kingfisher (ADR-007).
 *
 * The five light colors named in the ADR table (ground, ink, accent,
 * secondary, highlight) are used exactly as given. Everything else, and the
 * whole dark set, is derived here.
 *
 * Contrast measured with `npm run check-contrast` (WCAG 2.1, two decimals).
 * `tests/unit/skins.test.ts` asserts the same thresholds, so these cannot rot:
 *   light  ink/paper 13.78  ink2/paper 6.09  ink2/ground 5.57  ink2/secondarySoft 5.05  ink2/note 5.41  ink2/egg 5.14  ink/note 12.24  ink/egg 11.62  secondary/paper 5.58  secondary/secondarySoft 4.63  onAccent/accent 4.92  focus/paper 5.58
 *   dark   ink/paper 13.31  ink2/paper 6.53  ink2/ground 7.57  ink2/secondarySoft 5.78  ink2/note 6.02  ink2/egg 5.30  ink/note 12.27  ink/egg 10.80  secondary/paper 6.90  secondary/secondarySoft 6.11  onAccent/accent 5.64  focus/paper 6.90
 *
 * Nudged from the authored value to clear the threshold:
 *   dark --onAccent: #FFFFFF to #202122
 */
export const kingfisher: Skin = {
  id: 'kingfisher',
  label: 'Kingfisher',
  bird: 'Belted Kingfisher',
  light: {
    ground: '#F3F5F7',
    paper: '#FFFFFF',
    ink: '#1C2E44',
    ink2: '#56646F',
    line: '#D8DEE4',
    accent: '#B5542D',
    accentSoft: '#F6E6DF',
    secondary: '#4A6B8A',
    secondarySoft: '#E3EBF1',
    highlight: '#9DB9CE',
    egg: '#E4EDF3',
    note: '#F6F1E6',
    focus: '#4A6B8A',
    onAccent: '#FFFFFF',
  },
  dark: {
    ground: '#10161E',
    paper: '#1A2430',
    ink: '#E8EDF2',
    ink2: '#9BA9B6',
    line: '#33414F',
    accent: '#D98358',
    accentSoft: '#33241D',
    secondary: '#8FB0CB',
    secondarySoft: '#1F2E3B',
    highlight: '#9DB9CE',
    egg: '#263441',
    note: '#2A2A22',
    focus: '#8FB0CB',
    onAccent: '#202122',
  },
  fonts: {
    display: 'DM Serif Display',
    body: 'Public Sans',
    displayStack: "georgia, 'Times New Roman', serif",
    bodyStack: 'system-ui, -apple-system, sans-serif',
  },
};
