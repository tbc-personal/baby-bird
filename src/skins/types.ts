import type { SkinId } from './ids';

/**
 * The twelve token names components are allowed to use (ADR-007). Adding a
 * thirteenth means adding it to every skin, which is the point: a component can
 * never reach for a color that some skin has not defined.
 */
export interface Tokens {
  readonly ground: string;
  readonly paper: string;
  readonly ink: string;
  readonly ink2: string;
  readonly line: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly secondary: string;
  readonly secondarySoft: string;
  readonly highlight: string;
  readonly egg: string;
  readonly note: string;
  readonly focus: string;
  /** Text drawn on top of `accent`, e.g. the primary button label. */
  readonly onAccent: string;
}

export interface SkinFonts {
  /** The family name as declared in `public/fonts/fonts.css`. */
  readonly display: string;
  readonly body: string;
  /** Fallbacks appended after the self-hosted family. */
  readonly displayStack: string;
  readonly bodyStack: string;
}

export interface Skin {
  readonly id: SkinId;
  readonly label: string;
  readonly bird: string;
  readonly light: Tokens;
  readonly dark: Tokens;
  readonly fonts: SkinFonts;
}

/** Maps a token key to the CSS custom property components use. */
export const TOKEN_PROPERTY: Readonly<Record<keyof Tokens, string>> = {
  ground: '--ground',
  paper: '--paper',
  ink: '--ink',
  ink2: '--ink-2',
  line: '--line',
  accent: '--accent',
  accentSoft: '--accent-soft',
  secondary: '--secondary',
  secondarySoft: '--secondary-soft',
  highlight: '--highlight',
  egg: '--egg',
  note: '--note',
  focus: '--focus',
  onAccent: '--on-accent',
};
