/**
 * Percentage wording for the labor panel. Rounding to a whole number would turn
 * a small but real chance into "0%", and a near-certainty into "100%", both of
 * which overstate what the model knows.
 */
export function formatPercent(value: number): string {
  if (value > 0 && value < 0.01) return 'under 1%';
  if (value < 1 && value > 0.995) return 'over 99%';
  return `${Math.round(value * 100)}%`;
}
