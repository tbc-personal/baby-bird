/**
 * Size formatting. Imperial is the default and is what the source table is in;
 * metric values are converted and rounded (cm to one decimal, grams to whole).
 * Pure: no clock, no locale surprises beyond the explicit `en-US` used for dates
 * elsewhere.
 */
import type { Units } from './storage';
import type { LengthMeasure } from './schema';

export const CM_PER_INCH = 2.54;
export const GRAMS_PER_OUNCE = 28.349523125;
export const OUNCES_PER_POUND = 16;

/** Round to a fixed number of decimals without exponent surprises. */
function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Length. Imperial shows inches to one decimal, which is what the mockup does
 * ("11.4 in" for the stored 11.38). Sub-tenth seed lengths keep enough digits
 * to stay distinguishable.
 */
export function formatLength(lengthIn: number, units: Units): string {
  if (units === 'metric') {
    const cm = lengthIn * CM_PER_INCH;
    return `${round(cm, cm < 1 ? 2 : 1)} cm`;
  }
  return `${round(lengthIn, lengthIn < 1 ? 3 : 1)} in`;
}

/**
 * Weight. Above a pound the mockup reads "1 lb 1.6 oz" with the plain ounces
 * repeated underneath. Metric is whole grams.
 */
export function formatWeight(weightOz: number, units: Units): string {
  if (units === 'metric') {
    const grams = weightOz * GRAMS_PER_OUNCE;
    return grams < 1 ? `${round(grams, 2)} g` : `${Math.round(grams)} g`;
  }
  if (weightOz >= OUNCES_PER_POUND) {
    const pounds = Math.floor(weightOz / OUNCES_PER_POUND);
    const ounces = round(weightOz - pounds * OUNCES_PER_POUND, 1);
    return `${pounds} lb ${ounces} oz`;
  }
  return `${round(weightOz, 2)} oz`;
}

/**
 * The exact figure in the base unit, without the pound rollup: "17.6 oz".
 * The card repeats it under the headline weight (mockup 2).
 */
export function exactWeight(weightOz: number, units: Units): string {
  return units === 'metric'
    ? `${Math.round(weightOz * GRAMS_PER_OUNCE)} g`
    : `${round(weightOz, 2)} oz`;
}

/** The secondary line under the weight: "weight (17.6 oz)" in the mockup. */
export function weightDetail(
  weightOz: number,
  units: Units,
  isUpperBound: boolean,
): string {
  const exact = exactWeight(weightOz, units);
  return isUpperBound ? `weight, under ${exact}` : `weight (${exact})`;
}

/** Below a pound the headline weight already is the exact figure. */
export function weightNeedsDetail(weightOz: number, units: Units): boolean {
  return units === 'imperial' && weightOz >= OUNCES_PER_POUND;
}

export function lengthLabel(measure: LengthMeasure | null): string {
  if (measure === 'crown-heel') return 'length, head to heel';
  if (measure === 'crown-rump') return 'length, crown to rump';
  return 'length';
}

/** "an American Robin egg" / "a Blue Jay" / "a poppy seed". */
export function indefiniteArticle(word: string): 'a' | 'an' {
  const first = word.trim().charAt(0).toLowerCase();
  // Deliberately naive: the comparison names in this data set are all ordinary
  // English words or proper nouns, and none of them is a "one-"/"eu-"/"hour"
  // style exception. The data validator would surface a new name; this is not
  // a general-purpose article picker.
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

/** The full noun phrase shown on the card: "an American Robin egg". */
export function comparisonPhrase(comparison: string): string {
  return `${indefiniteArticle(comparison)} ${comparison}`;
}
