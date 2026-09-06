/**
 * WCAG 2.1 relative luminance and contrast ratio. Used by the skin tests to
 * assert every skin holds 4.5:1 on body text in both light and dark, and by
 * `scripts/check-contrast.ts` to print the table recorded in each skin file.
 */

/** Parse `#rgb` or `#rrggbb` into 0–255 channels. */
export function parseHex(hex: string): readonly [number, number, number] {
  const value = hex.trim().replace(/^#/, '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`not a hex color: ${hex}`);
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Rounded to two decimals, which is how the ratios are quoted in skin files. */
export function contrast(a: string, b: string): number {
  return Math.round(contrastRatio(a, b) * 100) / 100;
}

export const AA_NORMAL_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;
