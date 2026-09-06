/**
 * ADR-005: spontaneous-labor probability.
 *
 * The day of spontaneous labor onset, counted in days from the LMP, is modeled
 * as a two-component mixture:
 *
 *   D ~ π · Preterm + (1 − π) · Term
 *   Term    = Normal(μ_t, σ_t)
 *   Preterm = Normal(μ_p, σ_p) truncated to [140, 259)
 *
 * Preterm labor is a physiologically distinct process, not the tail of the term
 * one, which is the honest reason to give it its own component. It is also what
 * makes the fit possible: a single skew-normal (the family used before the
 * first follow-up, see the ADR-005 addenda) cannot meet the median, preterm and
 * post-term targets at once, and its left skew put the mode eight days after
 * the due date, which read as wrong on screen. A symmetric term component puts
 * the mode back beside the median.
 *
 * Nothing here is scraped from Datayze. The constraints below come from
 * published sources; the parameters were fitted to them offline by
 * `scripts/fit-labor-model.ts` and hard-coded, so the app does no numerical
 * optimization at runtime. Re-run that script to reproduce them.
 *
 * Pure module: no clock, no state.
 */

/**
 * The calibration targets.
 *
 * NOTE ON VERIFICATION: no build session so far has been able to open any of
 * these pages. The egress proxy refuses cdc.gov, ncbi.nlm.nih.gov and
 * datayze.com along with everything else, so the figures are those recorded in
 * `docs/research/datayze-features.md` during planning, plus two adjustment
 * factors taken from general obstetric literature. Confirm all of them before
 * release. See docs/decisions/ADR-005-datayze-derived-features.md.
 */
export const CALIBRATION = {
  /**
   * Smith GCS 2001, "Use of time to event analysis to estimate the normal
   * duration of human pregnancy", Hum Reprod: median non-elective delivery at
   * 283 days after LMP. Tolerance ±1 day.
   */
  medianDay: 283,
  medianSource: 'https://doi.org/10.1093/humrep/16.7.1497',

  /** Preterm is delivery before 37w0d, i.e. before day 259. */
  pretermDay: 259,

  /**
   * The headline CDC/NCHS figure: 10.4% of all US births in 2022 were preterm.
   * This is NOT the figure the model is fitted to, because it describes a
   * different population than the model does.
   */
  cdcAllBirthsPretermShare: 0.104,
  cdcYear: 2022,
  cdcSource: 'https://www.cdc.gov/maternal-infant-health/preterm-birth/index.html',

  /**
   * What the model is actually fitted to: the preterm share among *spontaneous
   * onset, singleton* pregnancies, which is what this distribution describes.
   * Two corrections take it there from the CDC figure:
   *
   *   1. Multiples. Twins and higher-order births are a small share of all
   *      births but a large share of preterm ones, and this model is explicitly
   *      singleton-only (ADR-005). The singleton preterm rate is roughly 9.3%.
   *   2. Provider-initiated delivery. Somewhere near 28% of preterm births are
   *      induced or delivered by scheduled caesarean for a medical indication,
   *      not by spontaneous onset. Spontaneous labor and PPROM account for the
   *      remaining ~72%.
   *
   *   0.093 x 0.72 = 0.067
   *
   * Both adjustment factors are round numbers from the general literature and
   * are the least well-sourced input to this model. The first follow-up session
   * had no more network access than the build session did, so neither could be
   * improved on; they are still the first thing to check on review.
   * Tolerance ±0.5 points.
   */
  pretermShare: 0.067,

  /**
   * Post-term is delivery after 42w0d, i.e. after day 294. Roughly 6%, from
   * Smith's survival curve. Tolerance ±1.5 points: the observed figure is
   * depressed by induction, and this model contains no induction at all.
   */
  postTermDay: 294,
  postTermTargetShare: 0.06,
  postTermSource: 'https://doi.org/10.1093/humrep/16.7.1497',

  /**
   * The mode must sit within two days of the median. This is not a published
   * figure; it is an on-screen requirement, asserted so it cannot regress. The
   * panel shows a "most likely single day", and a model whose most likely day
   * falls a week and a half after the due date reads as broken to anyone who
   * knows their due date.
   */
  modeWithinDaysOfMedian: 2,

  /**
   * Jukic AM et al. 2013, "Length of human pregnancy and contributors to its
   * natural variation", Hum Reprod. Not a fitted constraint, and the fitted
   * term component is tighter than Jukic's measured spread: see the σ_t note on
   * LABOR_MODEL.
   */
  jukicSource: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3777570/',
} as const;

/** The preterm component is truncated to this half-open interval, in days. */
export const PRETERM_SUPPORT = {
  /** 20w0d. Before this a loss is not a preterm birth. */
  firstDay: 140,
  /** 37w0d, exclusive. Preterm is by definition before this. */
  lastDayExclusive: CALIBRATION.pretermDay,
} as const;

/**
 * The residuals of the fit in `scripts/fit-labor-model.ts`. All four targets
 * are met; these are the achieved values, pinned by the unit tests so a change
 * to the numerics or the parameters shows up as a diff.
 */
export const FIT_RESIDUALS = {
  /** Target 283 ±1. */
  medianDay: 283.0,
  /** Target 0.067 ±0.005. */
  pretermShare: 0.067,
  /** Target 0.06 ±0.015. */
  postTermShare: 0.06,
  /** Target: within 2 days of the median. */
  modeDay: 284,
  /** Not a target. Kept non-zero so the curve does not call 43 weeks impossible. */
  beyond43WeeksShare: 0.0051,
} as const;

/**
 * A two-component mixture of labor-onset day, in days from the LMP.
 */
export interface MixtureParams {
  /** π: the share of pregnancies whose labor starts by the preterm process. */
  readonly pretermWeight: number;
  /** μ_p, before truncation. */
  readonly pretermMean: number;
  /** σ_p, before truncation. */
  readonly pretermSd: number;
  /** μ_t. Symmetric, so this is also the term component's median and mode. */
  readonly termMean: number;
  /** σ_t, in days. */
  readonly termSd: number;
}

/**
 * The fitted mixture. Produced by `npm run fit-labor-model`.
 *
 * μ_t and σ_t are solved for: with π fixed by the preterm target, the median
 * and post-term targets are two equations in two unknowns and have an exact
 * solution. π then follows from the preterm target.
 *
 * μ_p and σ_p are assumptions, not fits. The two constraints the preterm
 * component has to meet — that it carries share π and that all of it lands
 * before 37 weeks — leave its shape free, and no source in
 * `docs/research/datayze-features.md` pins it. 245 days (35w0d) with a 14-day
 * spread puts the bulk of preterm onset in the late-preterm weeks, which is
 * where most of it is observed. Nothing the app shows past 37 weeks depends on
 * the choice, because the conditional probability re-normalizes; what it does
 * change is the 34–37 week readings, and the sensitivity is documented in the
 * second ADR-005 addendum.
 *
 * σ_t = 6.83 days is tighter than Jukic 2013 measures the spread of term
 * gestation to be (roughly 10 to 13 days). It is forced by the post-term
 * target: a wider term component puts far more than 6% past 42 weeks. Since the
 * observed 6% is itself depressed by induction, the honest reading is that the
 * fitted σ_t is the spread of *delivered* gestations rather than of untouched
 * ones, and that this model runs slightly narrow past 41 weeks.
 */
export const LABOR_MODEL: MixtureParams = {
  pretermWeight: 0.066852,
  pretermMean: 245,
  pretermSd: 14,
  termMean: 283.6145,
  termSd: 6.8341,
};

/** The panel appears from 34w0d (mockup 4). */
export const LABOR_PANEL_FROM_DAY = 34 * 7;

/** Plotting range for the daily curve: 34w0d to 43w0d. */
export const CURVE_FIRST_DAY = 34 * 7;
export const CURVE_LAST_DAY = 43 * 7;

// --- normal primitives ------------------------------------------------------

const SQRT_2PI = Math.sqrt(2 * Math.PI);

/**
 * erf by Abramowitz & Stegun 7.1.26. Maximum absolute error 1.5e-7, which is
 * three orders finer than any figure this app shows, and simple enough to check
 * against published values (see tests/unit/laborProbability.test.ts).
 */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const poly =
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-z * z));
}

export function normalPdf(z: number): number {
  return Math.exp(-0.5 * z * z) / SQRT_2PI;
}

export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// --- the mixture ------------------------------------------------------------

/** The mass of the untruncated preterm normal that falls inside its support. */
function pretermNormalizer(model: MixtureParams): number {
  const { pretermMean: mean, pretermSd: sd } = model;
  return (
    normalCdf((PRETERM_SUPPORT.lastDayExclusive - mean) / sd) -
    normalCdf((PRETERM_SUPPORT.firstDay - mean) / sd)
  );
}

/** Density of the mixture at `day`, in probability per day. */
export function pdf(day: number, model: MixtureParams = LABOR_MODEL): number {
  const term =
    ((1 - model.pretermWeight) / model.termSd) *
    normalPdf((day - model.termMean) / model.termSd);
  if (day < PRETERM_SUPPORT.firstDay || day >= PRETERM_SUPPORT.lastDayExclusive) {
    return term;
  }
  const preterm =
    (model.pretermWeight / (model.pretermSd * pretermNormalizer(model))) *
    normalPdf((day - model.pretermMean) / model.pretermSd);
  return term + preterm;
}

/** Distribution function of the mixture: P(D ≤ day). */
export function cdf(day: number, model: MixtureParams = LABOR_MODEL): number {
  const term = (1 - model.pretermWeight) * normalCdf((day - model.termMean) / model.termSd);
  let preterm: number;
  if (day >= PRETERM_SUPPORT.lastDayExclusive) preterm = 1;
  else if (day <= PRETERM_SUPPORT.firstDay) preterm = 0;
  else {
    preterm =
      (normalCdf((day - model.pretermMean) / model.pretermSd) -
        normalCdf((PRETERM_SUPPORT.firstDay - model.pretermMean) / model.pretermSd)) /
      pretermNormalizer(model);
  }
  return clamp01(term + model.pretermWeight * preterm);
}

/** P(fromDay ≤ D ≤ toDay). */
export function probabilityInWindow(
  fromDay: number,
  toDay: number,
  model: MixtureParams = LABOR_MODEL,
): number {
  if (toDay <= fromDay) return 0;
  return clamp01(cdf(toDay, model) - cdf(fromDay, model));
}

/**
 * P(fromDay ≤ D ≤ toDay | D ≥ fromDay). This is the number the panel leads
 * with: the chance of labor starting in the window given it has not started
 * yet, which is what someone still pregnant today actually wants.
 */
export function conditionalProbabilityInWindow(
  fromDay: number,
  toDay: number,
  model: MixtureParams = LABOR_MODEL,
): number {
  if (toDay <= fromDay) return 0;
  const stillPregnant = 1 - cdf(fromDay, model);
  // Beyond the far tail the conditioning event has no probability left; the
  // honest answer there is 1, not a division by zero.
  if (stillPregnant <= 1e-12) return 1;
  return clamp01(probabilityInWindow(fromDay, toDay, model) / stillPregnant);
}

/** The single most likely day of onset, to the day. */
export function modeDay(model: MixtureParams = LABOR_MODEL): number {
  let best = CURVE_FIRST_DAY;
  let bestDensity = -1;
  for (let day = 200; day <= 320; day += 1) {
    const density = pdf(day, model);
    if (density > bestDensity) {
      bestDensity = density;
      best = day;
    }
  }
  return best;
}

/**
 * The most likely remaining day, given still pregnant on `fromDay`. Conditioning
 * only rescales the tail, so the peak is the unconditional mode unless that has
 * already passed.
 */
export function mostLikelyDayFrom(
  fromDay: number,
  model: MixtureParams = LABOR_MODEL,
): number {
  const mode = modeDay(model);
  return mode >= fromDay ? mode : fromDay;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
